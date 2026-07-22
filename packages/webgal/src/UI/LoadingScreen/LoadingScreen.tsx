import { useEffect, useRef, useState } from 'react';

/**
 * 进入游戏时的加载层：
 * 1. 拉取 game/background/manifest.json（列出所有 CG / 背景图）
 * 2. 逐张预加载，实时显示进度
 * 3. 全部完成后淡出并卸载，绝不阻塞游戏
 */
const BASE = import.meta.env.BASE_URL || './';

const STYLE_ID = 'webgal-loading-screen-style';

const css = `
.webgal-loading-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  background:
    radial-gradient(120% 120% at 50% 0%, #1b2a36 0%, #0d161d 55%, #070d12 100%);
  color: #f3e9d2;
  font-family: "Noto Serif SC", "Songti SC", "STSong", serif;
  transition: opacity 0.65s ease;
  user-select: none;
}
.webgal-loading-screen.is-hiding { opacity: 0; }
.webgal-loading-screen .ls-emblem {
  width: 78px; height: 78px;
  border-radius: 50%;
  border: 2px solid rgba(212,175,98,0.55);
  display: flex; align-items: center; justify-content: center;
  font-size: 34px; color: #d4af62;
  box-shadow: 0 0 28px rgba(212,175,98,0.25) inset, 0 0 22px rgba(212,175,98,0.18);
  animation: ls-pulse 2.4s ease-in-out infinite;
}
@keyframes ls-pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.06); opacity: 1; }
}
.webgal-loading-screen .ls-title {
  font-size: 26px; letter-spacing: 6px; font-weight: 600;
  text-shadow: 0 2px 14px rgba(0,0,0,0.5);
}
.webgal-loading-screen .ls-sub {
  font-size: 14px; letter-spacing: 2px; opacity: 0.7;
}
.webgal-loading-screen .ls-bar {
  width: min(420px, 72vw); height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(212,175,98,0.25) inset;
}
.webgal-loading-screen .ls-fill {
  height: 100%; width: 0%;
  border-radius: 999px;
  background: linear-gradient(90deg, #b9892f, #e9c46a, #d4af62);
  transition: width 0.25s ease;
}
.webgal-loading-screen .ls-pct {
  font-size: 13px; letter-spacing: 1px; opacity: 0.85;
  font-variant-numeric: tabular-nums;
}
`;

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [hiding, setHiding] = useState(false);
  const [removed, setRemoved] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // 注入一次性样式
    if (!document.getElementById(STYLE_ID)) {
      const tag = document.createElement('style');
      tag.id = STYLE_ID;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      // 至少展示一帧，避免闪屏
      setHiding(true);
    };

    const load = async () => {
      let images: string[] = [];
      try {
        const res = await fetch(BASE + 'game/background/manifest.json', {
          cache: 'no-cache',
        });
        if (res.ok) {
          const data = (await res.json()) as { images?: string[] };
          images = Array.isArray(data.images) ? data.images : [];
        }
      } catch {
        images = [];
      }

      // 兜底：没有清单就直接放行，绝不卡死
      if (images.length === 0) {
        finish();
        return;
      }

      let loaded = 0;
      const total = images.length;
      const tick = () => {
        loaded += 1;
        if (mountedRef.current) {
          setProgress(Math.round((loaded / total) * 100));
        }
        if (loaded >= total) finish();
      };

      images.forEach((name) => {
        const img = new Image();
        img.onload = tick;
        img.onerror = tick; // 单张失败也计入，保证进度能走完
        img.src = BASE + 'game/background/' + name;
      });
    };

    load();

    // 安全超时：5 秒后无论如何放行，避免网络异常导致永久卡在加载层
    const timer = window.setTimeout(finish, 5000);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      className={'webgal-loading-screen' + (hiding ? ' is-hiding' : '')}
      onTransitionEnd={() => {
        if (hiding) setRemoved(true);
      }}
    >
      <div className="ls-emblem">❖</div>
      <div className="ls-title">路易斯安那之路</div>
      <div className="ls-sub">EXPEDITION 1804 — 正在装载旅程画卷</div>
      <div className="ls-bar">
        <div className="ls-fill" style={{ width: progress + '%' }} />
      </div>
      <div className="ls-pct">{progress}%</div>
    </div>
  );
}
