import { useEffect, useRef, useState } from 'react';

/**
 * 进入游戏时的真实加载层（非象征性）：
 * - 读取 game/background/manifest.json，拿到全部「背景图(CG) + 角色立绘」
 * - 用 <img>.decode() 真正预载并解码每一张，进度 = 实际完成数
 * - 全部就绪后才淡出卸载；淡出时浏览器缓存已热，进场零等待
 * - 30s 仅作极端兜底（网络彻底卡死才放行），正常路径一定等加载完成
 */
const BASE = import.meta.env.BASE_URL || './';
const SAFETY_MS = 30000;

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
  gap: 24px;
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
.webgal-loading-screen .ls-now {
  font-size: 12px; opacity: 0.55; max-width: 72vw;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
`;

type Asset = { kind: 'background' | 'figure'; name: string };

export default function LoadingScreen() {
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState('');
  const [hiding, setHiding] = useState(false);
  const [removed, setRemoved] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
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
      setHiding(true);
    };

    const preload = async () => {
      let assets: Asset[] = [];
      try {
        const res = await fetch(BASE + 'game/background/manifest.json', {
          cache: 'no-cache',
        });
        if (res.ok) {
          const data = (await res.json()) as {
            background?: string[];
            figure?: string[];
          };
          const bg = (data.background ?? []).map(
            (n): Asset => ({ kind: 'background', name: n })
          );
          const fig = (data.figure ?? []).map(
            (n): Asset => ({ kind: 'figure', name: n })
          );
          assets = [...bg, ...fig];
        }
      } catch {
        assets = [];
      }

      // 兜底：拿不到清单直接放行，绝不卡死（极端异常路径）
      if (assets.length === 0) {
        finish();
        return;
      }

      setTotal(assets.length);
      let done = 0;
      const tick = (name: string) => {
        done += 1;
        if (!mounted.current) return;
        setLoaded(done);
        setCurrent(name);
        if (done >= assets.length) finish();
      };

      // 真正的逐张预载：onload 计完成数，decode() 预热解码确保淡出后秒显
      assets.forEach(({ kind, name }) => {
        const img = new Image();
        const url = BASE + 'game/' + kind + '/' + name;
        img.onload = () => tick(name);
        img.onerror = () => tick(name); // 单张失败也计入，进度照常走完
        img.src = url;
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {
            /* 解码预热失败不影响计数，onload/onerror 已兜底 */
          });
        }
      });
    };

    preload();

    // 仅极端兜底：网络彻底卡死 30s 未返回才放行，正常一定等加载完成
    const timer = window.setTimeout(finish, SAFETY_MS);

    return () => {
      mounted.current = false;
      window.clearTimeout(timer);
    };
  }, []);

  if (removed) return null;

  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;

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
        <div className="ls-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="ls-pct">
        {pct}%　·　{loaded} / {total}
      </div>
      {current && <div className="ls-now">{current}</div>}
    </div>
  );
}
