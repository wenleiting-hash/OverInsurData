/**
 * useIdleTimeout — 用户空闲自动登出
 *
 * 监听用户活动事件（鼠标、键盘、触摸、滚动），
 * 超过指定时间无操作时自动调用 logout 并跳转登录页。
 *
 * @param onTimeout  空闲超时后的回调（通常为 logout）
 * @param timeoutMs  空闲超时毫秒数，默认 30 分钟
 */
import { useEffect, useRef, useCallback } from 'react';

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
] as const;

/** 事件监听选项 —— 使用 capture + passive 保证不被 stopPropagation 阻断 */
const EVENT_OPTIONS: AddEventListenerOptions = { capture: true, passive: true };

export function useIdleTimeout(
  onTimeout: () => void | Promise<void>,
  timeoutMs = 30 * 60 * 1000, // 默认 30 分钟
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    // 启动初始计时器
    resetTimer();

    // 每次活动重置计时器（节流：同一 tick 内只重置一次）
    let rafId = 0;
    const handleActivity = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        resetTimer();
      });
    };

    ACTIVITY_EVENTS.forEach(evt =>
      document.addEventListener(evt, handleActivity, EVENT_OPTIONS),
    );

    // 页面重新可见时立即重置计时器（避免后台标签页误触发）
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') resetTimer();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafId) cancelAnimationFrame(rafId);
      ACTIVITY_EVENTS.forEach(evt =>
        document.removeEventListener(evt, handleActivity, EVENT_OPTIONS),
      );
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [resetTimer]);
}
