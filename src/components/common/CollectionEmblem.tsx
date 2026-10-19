/** Small native vector emblems keep the achievement states crisp at every size. */
export function CollectionEmblem({ kind }: { kind: number }) {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    {kind === 0 ? <><circle cx="18" cy="17" r="8" /><path d="m24 23 14 14m-7-7 5-5m0 10 5-5" /></>
      : kind === 1 ? <><path d="M13 35c-3-7 4-15 11-15s14 8 11 15c-2 5-8 0-11 0s-9 5-11 0Z" /><ellipse cx="12" cy="17" rx="3" ry="5" /><ellipse cx="23" cy="12" rx="3" ry="5" /><ellipse cx="34" cy="17" rx="3" ry="5" /></>
        : <path d="m24 6 5.5 11.2L42 19l-9 8.8L35.1 40 24 34.2 12.9 40 15 27.8 6 19l12.5-1.8Z" />}
  </svg>;
}
