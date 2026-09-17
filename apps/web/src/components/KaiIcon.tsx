import type { ReactNode } from 'react';

const shapes = {
  mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
  send: <path d="M12 20V4m-7 7 7-7 7 7" />,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  edit: <><path d="m14 5 5 5M4 20l5-1L20 8a2.1 2.1 0 0 0-5-5L4 14v6Z" /></>,
  replay: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" /><path d="m11 8 5 4-5 4Z" /></>,
  shield: <><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  arrow: <path d="m9 5 7 7-7 7" />,
  camera: <><path d="M4 7h4l2-3h4l2 3h4v13H4Z" /><circle cx="12" cy="13" r="4" /></>,
  feed: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
  growth: <><path d="M4 20V4M4 20h16M7 15l5-5 4 2 4-7M16 5h4v4" /></>,
  learn: <><path d="M12 6C9 3 5 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-2-1-6-1-9 2ZM12 6v15" /></>,
  network: <><circle cx="12" cy="5" r="3" /><circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" /><path d="m10 8-4 7m8-7 4 7M8 18h8" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
  tech: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M10 10h4v4h-4Z" /></>,
  crypto: <><path d="m12 3 9 7-9 11L3 10l9-7ZM3 10h18M8 10l4 11 4-11-4-7-4 7Z" /></>,
  message: <path d="M5 4h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2Z" />,
  settings: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" fill="currentColor" /><circle cx="16" cy="17" r="3" fill="currentColor" /></>,
} satisfies Record<string, ReactNode>;
export type KaiIconName = keyof typeof shapes;
export function KaiIcon({ name, className = 'h-5 w-5' }: { name: KaiIconName; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>{shapes[name]}</svg>;
}
