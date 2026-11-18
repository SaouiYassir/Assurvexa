import { useCallback, useEffect, useRef, useState } from 'react';
import { readAllRecords } from '../../services/record-pages';

export function useDashboardRecords(path, setError) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const request = useRef(null);

  const load = useCallback((controller) => readAllRecords(path, controller.signal)
    .then((data) => {
      if (!controller.signal.aborted) setRecords(data);
    })
    .catch((error) => {
      if (!controller.signal.aborted) {
        setError(error.response?.data?.message || `Could not load ${path.slice(1)} data.`);
      }
    })
    .finally(() => {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }), [path, setError]);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    load(controller);
    return () => request.current?.abort();
  }, [load]);

  async function reload(manual = false) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setError('');
    setLoading(!manual);
    setRefreshing(manual);
    await load(controller);
  }

  return { records, loading, refreshing, reload };
}

export function useRecordPage(records) {
  const [selection, setSelection] = useState(null);
  const pageSize = 10;
  const lastPage = Math.max(1, Math.ceil(records.length / pageSize));
  const page = selection?.records === records ? selection.page : 1;
  const start = (page - 1) * pageSize;

  return {
    rows: records.slice(start, start + pageSize),
    controls: { page, lastPage, onPageChange: (next) => setSelection({ records, page: next }) },
  };
}
