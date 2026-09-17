import { useEffect, type RefObject } from 'react';

export function useDwellTimeTracker(postId: string, video: RefObject<HTMLVideoElement | null>, enabled: boolean, csrfToken: string, expiresAt: number | null) {
  useEffect(() => {
    const media = video.current;
    if (!enabled || !media || !expiresAt || !('IntersectionObserver' in window)) return;
    let visible = false;
    let started: number | null = null;
    let watched = 0;
    let sent = false;
    const eventId = crypto.randomUUID();
    const controller = new AbortController();
    const tick = () => {
      const now = performance.now();
      if (started !== null) watched += now - started;
      const playing = visible && !document.hidden && !media.paused && !media.ended && !media.seeking && media.readyState >= 3 && Date.now() < expiresAt;
      started = playing ? now : null;
      if (watched < 4000 || sent || Date.now() >= expiresAt) return;
      sent = true;
      const completionRate = Number.isFinite(media.duration) && media.duration > 0 ? Math.min(1, watched / (media.duration * 1000)) : 0;
      void fetch('/api/engagement', { method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ operation: 'engagement', eventId, postId, watchTimeMs: Math.min(120000, Math.round(watched)), completionRate }),
      }).then(async response => {
        if (response.ok && (await response.json()).accepted) window.dispatchEvent(new Event('kai:feed-updated'));
      }).catch(() => { /* Optional telemetry must not interrupt viewing or queue offline data. */ });
    };
    const observer = new IntersectionObserver(entries => {
      tick();
      visible = entries.at(-1)?.intersectionRatio === 1;
      tick();
    }, { threshold: [0, 1] });
    observer.observe(media);
    const events = ['playing', 'pause', 'waiting', 'seeking', 'seeked', 'ended', 'emptied'] as const;
    for (const event of events) media.addEventListener(event, tick);
    document.addEventListener('visibilitychange', tick);
    const timer = window.setInterval(tick, 250);
    return () => {
      controller.abort(); observer.disconnect(); clearInterval(timer);
      for (const event of events) media.removeEventListener(event, tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [postId, video, enabled, csrfToken, expiresAt]);
}
