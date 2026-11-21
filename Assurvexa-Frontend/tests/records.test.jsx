import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import RecordSelect from '../src/pages/dashboard/RecordSelect';
import api from '../src/services/api';
import { readAllRecords } from '../src/services/record-pages';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn() },
}));

function page(records, lastPage = 1) {
  return { data: { data: { data: records, last_page: lastPage } } };
}

function ClaimSelect() {
  const [value, setValue] = useState('');

  return (
    <>
      <label htmlFor="claim_id">Claim</label>
      <RecordSelect
        label="Claim"
        name="claim_id"
        path="/claims"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        formatOption={(claim) => claim.description}
        reimbursable
      />
    </>
  );
}

beforeEach(() => vi.resetAllMocks());

test('record lists read each API page and retain one row per record', async () => {
  const { signal } = new AbortController();
  api.get
    .mockResolvedValueOnce(page([{ id: 1 }, { id: 2, description: 'Original' }], 2))
    .mockResolvedValueOnce(page([{ id: 2, description: 'Updated' }, { id: 3 }], 2));

  await expect(readAllRecords('/claims', signal)).resolves.toEqual([
    { id: 1 },
    { id: 2, description: 'Updated' },
    { id: 3 },
  ]);
  expect(api.get.mock.calls).toEqual([
    ['/claims', { params: { page: 1 }, signal }],
    ['/claims', { params: { page: 2 }, signal }],
  ]);
});

test('claim selection survives pagination and searching resets the page', async () => {
  api.get.mockImplementation(async (_path, { params }) => {
    if (params.search) return page([{ id: 3, description: 'Glass damage' }]);
    if (params.page === 2) return page([{ id: 2, description: 'Storm damage' }], 2);
    return page([{ id: 1, description: 'Windshield damage' }], 2);
  });
  const user = userEvent.setup();
  render(<ClaimSelect />);

  const select = screen.getByRole('combobox', { name: 'Claim' });
  await screen.findByRole('option', { name: 'Windshield damage' });
  await user.selectOptions(select, '1');
  await user.click(screen.getByRole('button', { name: 'Next' }));

  expect(await screen.findByRole('option', { name: 'Storm damage' })).toBeTruthy();
  expect(select.value).toBe('1');
  expect(screen.getByRole('option', { name: 'Windshield damage' }).selected).toBe(true);
  expect(api.get).toHaveBeenLastCalledWith('/claims', expect.objectContaining({
    params: { search: '', page: 2, reimbursable: 1 },
  }));

  await user.type(screen.getByRole('searchbox', { name: 'Search claim options' }), 'glass');

  expect(await screen.findByRole('option', { name: 'Glass damage' })).toBeTruthy();
  expect(select.value).toBe('1');
  expect(api.get).toHaveBeenLastCalledWith('/claims', expect.objectContaining({
    params: { search: 'glass', page: 1, reimbursable: 1 },
  }));
});

test('the record selector retries a failed request', async () => {
  api.get.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(page([]));
  const user = userEvent.setup();
  render(<ClaimSelect />);

  await user.click(await screen.findByRole('button', { name: 'Retry loading options' }));

  expect(await screen.findByText('No matching options.')).toBeTruthy();
  expect(api.get).toHaveBeenCalledTimes(2);
});
