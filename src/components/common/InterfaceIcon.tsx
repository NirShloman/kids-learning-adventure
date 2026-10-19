import type { CSSProperties } from 'react';

const paths = {
  play: 'm9 5 11 7-11 7V5Z',
  games: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 5h4m-2-2v4m7 5h.01M8 16h.01M16 8h.01',
  path: 'M6 21v-3a4 4 0 0 1 4-4h4a4 4 0 0 0 0-8h-1M6 4a2 2 0 1 0 0 .01M6 21h.01M18 3l3 3-3 3',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  collection: 'm12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1 3-6Z',
  sound: 'm11 4-6 5H2v6h3l6 5V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  menu: 'M5 6h14M5 12h14M5 18h14',
  spark: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',
  arrow: 'M20 12H4m6-6-6 6 6 6',
} as const;

export function InterfaceIcon({ name, style }: { name: keyof typeof paths; style?: CSSProperties }) {
  return <svg className="interface-icon" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
