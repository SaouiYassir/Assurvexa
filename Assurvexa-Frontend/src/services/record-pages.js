import api from './api';

export async function readRecordPage(path, params, signal) {
  const { data } = await api.get(path, { params, signal });
  return data.data;
}

export async function readAllRecords(path, signal) {
  const firstPage = await readRecordPage(path, { page: 1 }, signal);
  const records = new Map(firstPage.data.map((record) => [record.id, record]));

  for (let page = 2; page <= firstPage.last_page; page += 1) {
    const result = await readRecordPage(path, { page }, signal);
    for (const record of result.data) records.set(record.id, record);
  }

  return Array.from(records.values());
}
