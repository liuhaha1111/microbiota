# MicroFMT 多屏展示工具

在一台机器上模拟 MicroFMT 平台的多屏部署形态 —— **双击一个文件就能用，自动适配你有几块屏，各屏之间实时联动**。

> 位于仓库的 `tools/multiscreen/`。项目源码为支持「无侧边栏 + 跨屏联动」做过一轮改造，
> 见下面第三节。

---

## 一、怎么用（双击即可）

```
Start-MultiScreen.bat        ← 双击这个
```

脚本会自动完成全部准备：

1. 找到浏览器（优先 Chrome，没有就用 Edge）
2. 枚举你接了几块显示器、各自在哪
3. **检查 dev server 是否在跑，没跑就自动帮你起**（会多开一个控制台窗口，演示期间别关）
4. 启动浏览器并打开调试端口
5. 算出每个窗口的位置，通过调试协议把窗口逐个摆到对应屏上
6. 默认**全屏**

**结束演示**：双击 `Stop-MultiScreen.bat`，一次关掉所有窗口。

---

## 二、跨屏联动

所有窗口共享一个会话，以下状态在屏与屏之间实时同步：

| 状态 | 行为 |
|---|---|
| **当前受体病例** | 在任意一屏顶栏切换病例，**其余所有屏立刻跟着换** |
| **屏位投送状态** | 任意一屏点入口卡加载模块，**其余屏的启动台「已加载 N / 5」立刻更新** |

**不联动的是「哪块屏显示哪个模块」** —— 这是每屏私有的，屏 1 看数字孪生、屏 2 看菌群画像，互不干涉。

### 联动的硬前提：共享浏览器 profile

`BroadcastChannel` 和 `localStorage` 的作用域都是「同源 + 同一浏览器 profile」。所以**所有窗口必须共用一个 `user-data-dir`**。

这与「用命令行参数精确摆放窗口」正面冲突 —— Chromium 对同一 profile 只允许一个实例，第二次启动会把命令行转交给已有实例，`--window-position` 被**静默忽略**。

解决办法：窗口位置改由 **Chrome DevTools Protocol** 的 `Browser.setWindowBounds` 设置（见 `launch.mjs`），它能把同一实例内的每个窗口单独摆到指定位置。两者兼得。

> 启动日志里会打印 `Session : xxxxxxxx  (cross-screen sync ON)`。看到这行就说明联动已启用。

### 单窗口使用不受影响

应用只在 URL 带 `?wall=<会话号>` 时才启用同步。你平时直接开 `http://localhost:3000` 调试，行为和以前完全一样，也不会被上一次演示残留在 `localStorage` 里的病例污染。

---

## 三、大屏形态：没有左侧目录

模块屏**不再渲染左侧导航**。原因：真实部署下每块屏只承载一个模块，模块之间不互相跳转，侧边栏里那个「模块切换器」在大屏上是纯占位 —— 它在 1024 宽的屏上要吃 224px。

取而代之：

- **回到启动台**：顶栏左上角（品牌区右侧）的「启动台」按钮。停在主屏时不渲染，避免出现点不动的控件。
- **切换模块**：先回启动台，再点另一张入口卡。这是唯一的路径，也是刻意的 —— 每块屏的模块归属应当稳定。
- **每屏所需的全部上下文**由各模块的常驻 ContextBar 承载（信息自洽），不依赖跨模块跳转。

---

## 四、它会开几个窗口

**每个显示器一个窗口，铺满整块屏并全屏。**

| 你的显示器数量 | 实际效果 |
|---|---|
| **2 块**（笔记本 + 外接） | 开 **2 个**窗口，各占一块屏 |
| 3 块 | 开 3 个窗口 |
| 1 块（只有笔记本） | 自动降级：在单屏上平铺 **5 个**窗口（3 上 2 下），这样 5 个模块仍能一眼看全 |
| 5 块及以上 | 开 5 个窗口 —— 平台只有 5 个屏位，第 6 个窗口没有模块可承载 |

窗口数量上限就是屏数，**绝不会两个窗口叠在同一块屏上**。

### 2 块屏时只能同时看到 2 个模块

这是物理限制。另外 3 个模块从启动台随时可进。想在一台机器上同时看到全部 5 个模块：

```powershell
.\Start-MultiScreen.bat -Mode tile5
```

代价是每个窗口只有 640×540 左右，界面会退到窄屏布局，**不适合做视觉验收**，适合做并发压测。

---

## 五、布局模式

```powershell
.\Start-MultiScreen.bat                   # auto（默认）
.\Start-MultiScreen.bat -Mode perScreen   # 每屏一个窗口
.\Start-MultiScreen.bat -Mode tile5       # 单屏平铺 5 个窗口（压测）
.\Start-MultiScreen.bat -Mode spread      # 5 个窗口按屏宽比例分到各屏
```

| 模式 | 行为 | 用途 |
|---|---|---|
| `auto` | 屏数 ≥ 2 → `perScreen`；单屏 → `tile5` | 默认，不用想 |
| `perScreen` | 每块屏一个窗口，铺满并全屏 | **真实多屏观感验证** |
| `tile5` | 全挤在一块屏上，3 上 2 下 | **5 实例并发压测** |
| `spread` | 5 个窗口按屏宽比例连续分配 | 想多开窗口又不想全挤一屏 |

`spread` 在 2 块 1920 屏上的实际分配：左屏 2 个（各 944 宽）、右屏 3 个（各 626 宽），屏位编号从左到右连续。

---

## 六、其他常用命令

```powershell
# 不全屏（保留标题栏和地址栏，方便拖拽或开 DevTools）
.\Start-MultiScreen.bat -Windowed

# 指定端口（dev server 不是 3000 时）
.\Start-MultiScreen.bat -Port 5173

# 指定项目路径（默认自动从脚本位置推断，即仓库根目录）
.\Start-MultiScreen.bat -ProjectDir "E:\code\microbiota"

# 指定浏览器
.\Start-MultiScreen.bat -BrowserPath "C:\Program Files\Google\Chrome\Application\chrome.exe"

# 只开 2 个窗口
.\Start-MultiScreen.bat -Mode perScreen -WindowCount 2

# 调试端口被占用时换一个
.\Start-MultiScreen.bat -CdpPort 9333

# 不让脚本自动起 dev server，没起就报错退出
.\Start-MultiScreen.bat -NoServe

# 清空浏览器 profile 后重启
.\Start-MultiScreen.bat -CleanProfile

# 关闭全部窗口（等同于双击 Stop-MultiScreen.bat）
.\Start-MultiScreen.bat -Stop
```

---

## 七、验收清单

- [ ] **窗口互相独立** —— 屏 1 点「工作台」，屏 2 不会被带着跳走
- [ ] **病例联动** —— 屏 1 顶栏换病例，屏 2 顶栏跟着换
- [ ] **投送状态联动** —— 屏 1 加载模块后，屏 2 启动台的「已加载」计数 +1
- [ ] **屏位徽标正确** —— 屏 1 显示「屏 1」、屏 2 显示「屏 2」
- [ ] **侧边栏确实消失** —— 模块内左侧不再有目录
- [ ] **返回启动台可用** —— 顶栏「启动台」按钮能回到主屏
- [ ] **3D 数字孪生流畅** —— 尤其 `tile5` 模式下观察是否掉帧
- [ ] **任务管理器内存** —— 记下多实例总占用，作为真实部署的硬件参考

---

## 八、常见问题

### 病例切换了但其他屏不动

先看启动日志有没有 `Session : xxx  (cross-screen sync ON)`。

- **没有** → 窗口不是脚本起的，URL 缺 `?wall=`。用脚本启动即可。
- **有** → 检查是不是有窗口用了不同的 `user-data-dir`（比如你手动又开了一个）。所有窗口必须共用一个 profile，否则 `BroadcastChannel` 收不到。

### 窗口位置全乱 / 全叠在一起

说明 CDP 定位那一步失败了，启动日志里会有 `Window placement over CDP failed`。

常见原因：

- **调试端口被占用** —— 换一个：`-CdpPort 9333`
- **Node.js 不在 PATH** —— 脚本会降级到「只有第一个窗口位置准」，其余手动拖
- **浏览器版本过旧** —— CDP 的 `newWindow` 参数需要较新的 Chromium

### 数字孪生动画卡住 / 静止

Windows 会把被其他窗口遮住的窗口判定为 *occluded*，Chromium 随即降低甚至暂停 `requestAnimationFrame`。

脚本已内置压制开关：

```
--disable-features=CalculateNativeWinOcclusion
--disable-backgrounding-occluded-windows
--disable-renderer-backgrounding
--disable-background-timer-throttling
```

另外源码里 `ThreeGutDigitalTwin.tsx` 已用 `THREE.Timer.connect(document)` 接入 Page Visibility。

### 全屏后怎么切窗口 / 怎么退出

- 切窗口：`Alt + Tab`
- 退出全屏：`Esc`（窗口保留）；关窗口：`Alt + F4`

### 双击后一闪而过 / 报执行策略错误

`.bat` 里已经带了 `-ExecutionPolicy Bypass` 和 `pause`，正常不会闪退。若被组策略拦下，右键 `.bat` →「以管理员身份运行」。

### dev server 窗口被我关了

页面会失去热更新和资源加载。重新双击 `Start-MultiScreen.bat`，脚本会检测到服务不在并重新拉起。

### 磁盘被占满

共享 profile 一份，约 100–200 MB。清理：

```powershell
.\Start-MultiScreen.bat -Stop
Remove-Item .\profiles -Recurse -Force
```

---

## 九、从单机测试走向真实多屏

单机模拟验证的是**功能正确性**：多实例各自独立、联动生效、屏位绑定不错位、并发性能可接受。

它**验证不了真实观感** —— 2 块屏放不下 5 个够宽的窗口。真到多屏环境时还需要：

1. **物理连接** —— 5 路输出需要第二张显卡、DisplayLink 扩展坞，或 DP MST 菊花链。
2. **窗口落到指定屏** —— 脚本已经会用 CDP 自动摆放，多屏环境下不需要额外操作。

屏位 ↔ 模块的对应关系以 `src/data/screenSlots.ts` 为唯一准绳，不要凭记忆。

---

## 十、文件说明

| 文件 | 作用 |
|---|---|
| `Start-MultiScreen.bat` | **双击启动**（入口） |
| `Stop-MultiScreen.bat` | **双击关闭**所有窗口 |
| `Start-MicroFMT-MultiScreen.ps1` | 主逻辑：探屏、起服务、算布局、拉浏览器 |
| `launch.mjs` | 通过 Chrome DevTools Protocol 创建并摆放每个窗口 |
| `profiles\wall\` | 所有窗口共用的浏览器 profile（联动的前提），可随时删除 |

> 两个脚本的注释全部使用 ASCII。Windows PowerShell 5.1 会把无 BOM 的 `.ps1` 按 ANSI 解码，中文注释会在解析阶段就乱码。

---

## 十一、项目侧改了什么

本轮为支持大屏形态，项目源码改了三处：

| 文件 | 改动 |
|---|---|
| `src/utils/wallSync.ts` | **新增**。跨屏同步的通道命名、快照读写、内容比对 |
| `src/hooks/useWallSync.ts` | **新增**。接入同步会话的 React hook |
| `src/App.tsx` | 移除侧边栏渲染；接入联动；`view` 保持本地，`dispatched` 与 `currentPatient` 共享 |
| `src/components/TopHeader.tsx` | 新增「启动台」返回按钮 |
| `src/components/SideNavigation.tsx` | **删除** |
| `src/components/HomeConsole.tsx` | 说明条补充「跨屏联动」标识 |

同步层的两个关键细节，改动时不要踩：

1. **广播前必须比对内容。** 远端状态会改变 effect 依赖，无条件广播会在两屏之间来回弹射形成无限循环。
2. **`main.tsx` 开着 StrictMode**，effect 会被双调用，cleanup 必须真正 close 掉 channel，重复应用同一份快照要幂等。
