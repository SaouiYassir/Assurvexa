export default function RecordPagination({ page, lastPage, onPageChange, label = 'Results pagination' }) {
  if (lastPage <= 1) return null;

  return (
    <nav className="dashboard-pagination" aria-label={label}>
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span>Page {page} of {lastPage}</span>
      <button type="button" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
