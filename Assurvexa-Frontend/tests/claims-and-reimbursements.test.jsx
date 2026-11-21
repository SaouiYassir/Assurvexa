import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { AuthContext } from '../src/context/auth-context';
import Claims from '../src/pages/dashboard/claims/claims';
import Reimbursements from '../src/pages/dashboard/reimbursements/reimbursements';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

function renderFor(role, view) {
  render(
    <AuthContext.Provider value={{ user: { role } }}>
      {view}
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  api.post.mockResolvedValue({ data: { success: true } });
  api.get.mockImplementation(async (path, { params }) => {
    let records = [];
    if (path === '/contracts') records = [{ id: 3, policy: { nom: 'Road cover' } }];
    if (path === '/claims' && params.reimbursable === 1) {
      records = [{ id: 7, prix_estime: 500 }];
    }
    return { data: { data: { data: records, last_page: 1 } } };
  });
});

test('a customer submits a claim against a listed contract', async () => {
  const user = userEvent.setup();
  renderFor('customer', <Claims />);

  await user.click(screen.getByRole('button', { name: /file a claim/i }));
  const form = within(screen.getByRole('dialog'));
  await form.findByRole('option', { name: /Contract #3.*Road cover/ });
  await user.selectOptions(form.getByLabelText('Contract'), '3');
  fireEvent.change(form.getByLabelText('Incident Date'), { target: { value: '2025-05-01' } });
  await user.type(form.getByLabelText('Estimated Amount (MAD)'), '500');
  await user.type(form.getByLabelText('Incident Description'), 'Windshield damage');
  await user.click(form.getByRole('button', { name: 'Submit Claim' }));

  expect(api.post).toHaveBeenCalledExactlyOnceWith('/claims', {
    contract_id: 3,
    incident_date: '2025-05-01',
    prix_estime: 500,
    description: 'Windshield damage',
  });
  expect(await screen.findByText('Claim submitted successfully.')).toBeTruthy();
});

test('an agent issues reimbursement for a claim from the eligible list', async () => {
  const user = userEvent.setup();
  renderFor('agent', <Reimbursements />);

  await user.click(screen.getByRole('button', { name: 'Issue Reimbursement' }));
  const form = within(screen.getByRole('dialog'));
  await form.findByRole('option', { name: /Claim #7/ });
  expect(api.get).toHaveBeenCalledWith('/claims', expect.objectContaining({
    params: { search: '', page: 1, reimbursable: 1 },
  }));
  await user.selectOptions(form.getByLabelText('Approved Claim'), '7');
  await user.clear(form.getByLabelText('Amount (MAD)'));
  await user.type(form.getByLabelText('Amount (MAD)'), '250');
  await user.selectOptions(form.getByLabelText('Payment Method'), 'cash');
  await user.click(form.getByRole('button', { name: 'Issue Reimbursement' }));

  expect(api.post).toHaveBeenCalledExactlyOnceWith('/reimbursements', {
    claim_id: 7,
    prix: 250,
    methode_paiement: 'cash',
    status_paiement: 'pending',
    date_paiement: null,
  });
  expect(await screen.findByText('Reimbursement issued successfully.')).toBeTruthy();
});
