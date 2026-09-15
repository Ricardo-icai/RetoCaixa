import { useRouter } from 'next/router';
import { useRef, type ReactNode, type TouchEvent } from 'react';
import { activeMainTab, mainTabs } from '../navigation/mainTabs';

interface TouchStart {
  x: number;
  y: number;
}

function blocksPageSwipe(target: EventTarget | null, boundary: HTMLElement) {
  let element = target instanceof HTMLElement ? target : null;
  while (element && element !== boundary) {
    if (element.matches('a, button, input, textarea, select, [contenteditable="true"], [data-swipe-ignore]')) return true;
    const overflowX = getComputedStyle(element).overflowX;
    if ((overflowX === 'auto' || overflowX === 'scroll') && element.scrollWidth > element.clientWidth) return true;
    element = element.parentElement;
  }
  return false;
}

export function SwipeNavigation({ children }: { children: ReactNode }) {
  const router = useRouter();
  const start = useRef<TouchStart | null>(null);

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1 || activeMainTab(router.pathname) < 0 || blocksPageSwipe(event.target, event.currentTarget)) {
      start.current = null;
      return;
    }
    start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const origin = start.current;
    start.current = null;
    if (!origin || event.changedTouches.length !== 1) return;
    const deltaX = event.changedTouches[0].clientX - origin.x;
    const deltaY = event.changedTouches[0].clientY - origin.y;
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    const current = activeMainTab(router.pathname);
    const next = deltaX < 0 ? current + 1 : current - 1;
    if (next >= 0 && next < mainTabs.length) void router.push(mainTabs[next].path);
  }

  return <div className="min-h-screen" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => { start.current = null; }}>
    {children}
  </div>;
}
