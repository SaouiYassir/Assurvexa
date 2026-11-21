import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { AuthContext } from '../src/context/auth-context';
import Contracts from '../src/pages/dashboard/contracts/contracts';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const customer = { id: 3, user: { first_name: 'Sam', last_name: 'Martin', email: 'sam@example.test' } };
const policy = { id: 5, nom: 'Road cover', prix: '500.00' };

function renderContracts(role) {
  render(
    <AuthContext.Provider value={{ user: { role } }}>
      <Contracts />
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  const records = { '/contracts': [], '/customers': [customer], '/policies': [policy] };
  api.get.mockImplementation(async (path) => ({
    data: { data: { data: records[path], last_page: 1 } },
  }));
});

test('an agent submits the new contract form and refreshes the list', async () => {
  api.post.mockResolvedValue({ data: { data: { id: 1 } } });
  const user = userEvent.setup();
  renderContracts('agent');

  await user.click(screen.getByRole('button', { name: 'New Contract' }));
  const form = within(screen.getByRole('dialog'));
  await form.findByRole('option', { name: /Sam Martin/ });
  await form.findByRole('option', { name: /Road cover/ });

  await user.selectOptions(form.getByLabelText('Customer'), '3');
  await user.selectOptions(form.getByLabelText('Insurance Policy'), '5');
  await user.selectOptions(form.getByLabelText('Status'), 'pending');
  fireEvent.change(form.getByLabelText('Start Date'), { target: { value: '2026-11-21' } });
  fireEvent.change(form.getByLabelText('End Date'), { target: { value: '2026-11-30' } });
  await user.click(form.getByRole('button', { name: 'Create Contract' }));

  expect(api.post).toHaveBeenCalledExactlyOnceWith('/contracts', {
    customer_id: 3,
    policy_id: 5,
    status: 'pending',
    date_debut: '2026-11-21',
    date_fin: '2026-11-30',
  });
  expect(await screen.findByText('Contract created successfully.')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
  await waitFor(() => {
    expect(api.get.mock.calls.filter(([path]) => path === '/contracts')).toHaveLength(2);
  });
});

test.each(['customer', 'admin'])('the contract view hides creation for %s accounts', async (role) => {
  renderContracts(role);

  expect(await screen.findByText(/no contracts found/i)).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'New Contract' })).toBeNull();
});
