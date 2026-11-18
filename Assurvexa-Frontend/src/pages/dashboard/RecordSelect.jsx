import { useEffect, useState } from 'react';
import { readRecordPage } from '../../services/record-pages';
import RecordPagination from './RecordPagination';

export default function RecordSelect({
  className, label, name, path, value, onChange, formatOption, initialOption, reimbursable = false,
}) {
  const [query, setQuery] = useState({ search: '', page: 1 });
  const [result, setResult] = useState(null);
  const [selection, setSelection] = useState(null);
  const current = result?.query === query ? result : null;
  const options = current?.data?.data ?? [];
  const extraOptions = [initialOption, selection].filter(Boolean);
  const available = new Map([...extraOptions, ...options].map((record) => [String(record.id), record]));
  const lastPage = result?.query.search === query.search ? result.data?.last_page : undefined;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const data = await readRecordPage(path, {
          ...query,
          reimbursable: reimbursable ? 1 : undefined,
        }, controller.signal);
        if (!controller.signal.aborted) setResult({ query, data });
      } catch {
        if (!controller.signal.aborted) setResult({ query, error: true });
      }
    }, query.search ? 250 : 0);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [path, query, reimbursable]);

  function handleChange(event) {
    const record = available.get(event.target.value);
    setSelection(record);
    onChange(event, record);
  }

  return (
    <div className="dashboard-record-select">
      <input
        className={className}
        type="search"
        aria-label={`Search ${label.toLowerCase()} options`}
        placeholder={`Search ${label.toLowerCase()} options`}
        maxLength={100}
        value={query.search}
        onChange={(event) => setQuery({ search: event.target.value, page: 1 })}
      />
      <select id={name} name={name} className={className} value={value} onChange={handleChange} required>
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {value && !available.has(String(value)) && (
          <option value={value}>{`#${value}`}</option>
        )}
        {Array.from(available.values()).map((record) => (
          <option key={record.id} value={record.id}>{formatOption(record)}</option>
        ))}
      </select>
      {current?.error ? (
        <button type="button" onClick={() => setQuery({ ...query })}>Retry loading options</button>
      ) : (
        <span role="status">
          {!current ? 'Loading options…' : options.length === 0 ? 'No matching options.' : ''}
        </span>
      )}
      {lastPage && (
        <RecordPagination
          page={query.page}
          lastPage={lastPage}
          onPageChange={(page) => setQuery({ ...query, page })}
          label={`${label} options pagination`}
        />
      )}
    </div>
  );
}
