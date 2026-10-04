import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isWallSyncSupported,
  readWallSession,
  readWallSnapshot,
  wallChannelName,
  writeWallSnapshot,
  type WallSyncState
} from '../utils/wallSync';

export interface WallSyncApi {
  /** 本窗口是否参与跨屏同步（URL 带了 ?wall=） */
  active: boolean;
  /** 会话标识，未参与时为 null */
  session: string | null;
  /** 广播一次状态变更 */
  publish: (state: WallSyncState) => void;
}

/**
 * 把本窗口接入多屏同步会话。
 *
 * 几个不显眼但必须处理的地方：
 *
 * 1. **只有带 ?wall=<id> 时才激活。** 单窗口日常访问不带该参数，同步层整体
 *    不介入，行为与引入联动之前完全一致。
 * 2. **新窗口挂载时先读一次 localStorage 快照。** BroadcastChannel 没有历史
 *    消息，不主动拉取的话，后开的窗口要等到下一次有人操作才会同步。
 * 3. **StrictMode 会双调用 effect**（本项目 main.tsx 开着 StrictMode），因此
 *    cleanup 必须真正 close 掉 channel；重复应用同一份快照也要幂等——这一条
 *    由调用方通过 isSameWallState / isSameDispatched 保证。
 * 4. **不需要 senderId 过滤。** 同一个 BroadcastChannel 对象收不到自己发出的
 *    消息，广播天然不会回到本窗口。
 * 5. **回调用 ref 持有。** 否则父组件每次重渲染都会重建 channel，重建期间
 *    发出的广播会被丢掉。
 */
export function useWallSync(onRemoteState: (state: WallSyncState) => void): WallSyncApi {
  const [session] = useState<string | null>(() => readWallSession());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const handlerRef = useRef(onRemoteState);
  handlerRef.current = onRemoteState;

  useEffect(() => {
    if (!session || !isWallSyncSupported()) return;

    const snapshot = readWallSnapshot(session);
    if (snapshot) handlerRef.current(snapshot);

    const channel = new BroadcastChannel(wallChannelName(session));
    channel.onmessage = (event: MessageEvent<WallSyncState>) => {
      const incoming = event.data;
      if (!incoming || typeof incoming.patientId !== 'string' || !Array.isArray(incoming.dispatched)) {
        return;
      }
      handlerRef.current(incoming);
    };
    channelRef.current = channel;

    return () => {
      channel.onmessage = null;
      channel.close();
      channelRef.current = null;
    };
  }, [session]);

  const publish = useCallback(
    (state: WallSyncState) => {
      if (!session || !isWallSyncSupported()) return;
      writeWallSnapshot(session, state);
      channelRef.current?.postMessage(state);
    },
    [session]
  );

  return { active: session !== null, session, publish };
}
