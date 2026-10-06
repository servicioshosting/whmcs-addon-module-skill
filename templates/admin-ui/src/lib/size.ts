const IN_IFRAME = window.top !== window;

let rafId: number | null = null;

interface SizeMessage {
  type: '<Prefix>:height';
  height: number;
}

export function notifyHeight(): void {
  if (!IN_IFRAME) return;
  const height = document.documentElement.scrollHeight;
  const payload: SizeMessage = { type: '<Prefix>:height', height };
  window.parent.postMessage(payload, '*');
}

export function watchHeight(): () => void {
  if (!IN_IFRAME) return () => {};

  const schedule = (): void => {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      notifyHeight();
    });
  };

  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);
  window.addEventListener('resize', schedule);
  notifyHeight();

  return () => {
    observer.disconnect();
    window.removeEventListener('resize', schedule);
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
