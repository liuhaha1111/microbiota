import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {applyDisplayMode, loadDisplayMode} from './utils/displayMode';

// 在 React 挂载前先把上次选的显示档位写到 <html> 上。
// 放在这里而不是组件 effect 里，是为了避免首帧先按标准档渲染再跳变大字号。
applyDisplayMode(loadDisplayMode());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
