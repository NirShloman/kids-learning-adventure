export function PageControls({ page, count, onChange }: { page: number; count: number; onChange: (page: number) => void }) {
  if (count <= 1) return null;
  return <nav className="page-controls" aria-label="מעבר בין עמודים">
    <button type="button" aria-label="לעמוד הקודם" disabled={page === 0} onClick={() => onChange(page - 1)}>→ הקודם</button>
    <span role="status" dir="ltr">{page + 1} / {count}</span>
    <button type="button" aria-label="לעמוד הבא" disabled={page + 1 >= count} onClick={() => onChange(page + 1)}>הבא ←</button>
  </nav>;
}
