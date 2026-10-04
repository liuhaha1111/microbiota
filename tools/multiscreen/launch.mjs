#!/usr/bin/env node
/**
 * MicroFMT 多屏窗口定位器
 *
 * 为什么需要它
 * ------------
 * Chromium 对同一 profile 只允许存在一个浏览器实例：第二个进程启动时会把命令行
 * 转交给已有实例，于是 --window-position / --window-size 被**静默忽略**。
 *
 * 而跨屏联动又要求所有窗口共用同一个 profile —— BroadcastChannel 与 localStorage
 * 的作用域都是「同源 + 同一 profile」，各窗口用独立 user-data-dir 时它们分属不同
 * 浏览器实例，互相收不到广播，联动会静默失效（不报错，只是不动）。
 *
 * 两个约束正面冲突，所以窗口位置改由 Chrome DevTools Protocol 的
 * Browser.setWindowBounds 设置 —— 它能把同一实例内的每个窗口单独摆到指定位置。
 *
 * 输入：一个 JSON 配置文件路径（由 PowerShell 生成）
 *   {
 *     "cdpPort": 9222,
 *     "url": "http://localhost:3000/?wall=abc123",
 *     "fullscreen": true,
 *     "rects": [{ "x": 0, "y": 0, "w": 1920, "h": 1080 }, ...]
 *   }
 * 输出：stdout 一行 JSON 结果；失败时 stderr 输出错误并返回非零退出码。
 */
import { readFileSync } from 'node:fs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const configPath = process.argv[2];
if (!configPath) {
  process.stderr.write('usage: node launch.mjs <config.json>\n');
  process.exit(2);
}

// PowerShell 5.1 的 Set-Content -Encoding UTF8 会写 BOM，而 JSON.parse 遇到
// 开头的 U+FEFF 会直接抛错，所以这里主动剥掉。
const raw = readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
const config = JSON.parse(raw);
const rects = Array.isArray(config.rects) ? config.rects : [];
if (rects.length === 0) {
  process.stderr.write('config.rects is empty\n');
  process.exit(2);
}

let nextId = 1;
const pending = new Map();
let socket = null;

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout after 15s: ${method}`));
    }, 15000);
    pending.set(id, {
      resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (err) => { clearTimeout(timer); reject(err); }
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function waitForCdp(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch (err) {
      lastError = err;
    }
    await sleep(400);
  }
  throw new Error(
    `CDP endpoint not reachable on port ${port} (${lastError ? lastError.message : 'timeout'})`
  );
}

const setBounds = (windowId, bounds) =>
  send('Browser.setWindowBounds', { windowId, bounds });

async function main() {
  // Node only exposes a global WebSocket from v22 onwards. Failing loudly here
  // beats the bare "WebSocket is not defined" the caller would otherwise see.
  if (typeof WebSocket !== 'function') {
    throw new Error(
      `this Node build (${process.version}) has no global WebSocket; ` +
      'window placement over the DevTools Protocol requires Node 22 or newer'
    );
  }

  const port = config.cdpPort || 9222;
  const version = await waitForCdp(port, config.cdpTimeoutMs || 45000);

  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('failed to open CDP websocket')), { once: true });
  });

  socket.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (typeof message.id !== 'number') return; // 事件通知，忽略
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(`${message.error.message} (code ${message.error.code})`));
    else entry.resolve(message.result);
  });

  // 启动浏览器时它已经自带一个窗口，直接征用作为第一块屏，避免多出一个空白页。
  const { targetInfos } = await send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page');

  const targetIds = [];
  if (pages.length > 0) targetIds.push(pages[0].targetId);
  for (const extra of pages.slice(1)) {
    await send('Target.closeTarget', { targetId: extra.targetId }).catch(() => {});
  }

  while (targetIds.length < rects.length) {
    const created = await send('Target.createTarget', {
      url: config.url,
      newWindow: true,
      background: false
    });
    targetIds.push(created.targetId);
    await sleep(250);
  }

  const placed = [];
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const { windowId } = await send('Browser.getWindowForTarget', { targetId: targetIds[i] });

    // 先回到 normal —— 处于 maximized / fullscreen 的窗口会拒绝设置位置。
    await setBounds(windowId, { windowState: 'normal' });
    await setBounds(windowId, {
      left: Math.round(rect.x),
      top: Math.round(rect.y),
      width: Math.round(rect.w),
      height: Math.round(rect.h)
    });

    if (config.fullscreen !== false) {
      await setBounds(windowId, { windowState: 'fullscreen' });
    }

    placed.push({ screen: i + 1, windowId, targetId: targetIds[i], ...rect });
    await sleep(150);
  }

  socket.close();
  return { ok: true, url: config.url, windows: placed };
}

main()
  .then((result) => {
    process.stdout.write(JSON.stringify(result) + '\n');
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(String(err && err.stack ? err.stack : err) + '\n');
    process.exit(1);
  });
