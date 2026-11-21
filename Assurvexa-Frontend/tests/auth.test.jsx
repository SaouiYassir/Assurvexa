import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { response: { use: vi.fn(), eject: vi.fn() } },
  },
}));

const account = { id: 7, role: 'agent', first_name: 'Sam', last_name: 'Martin' };

function renderApp(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

test('a guest opening a dashboard route is redirected to sign-in', async () => {
  api.get.mockRejectedValueOnce({ response: { status: 401 } });
  renderApp('/dashboard/contracts');

  expect(screen.getByText('Loading your session...')).toBeTruthy();
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy();
  expect(api.get).toHaveBeenCalledExactlyOnceWith('/me', { skipAuthState: true });
});

test('a valid session can open a protected dashboard route directly', async () => {
  api.get
    .mockResolvedValueOnce({ data: { user: account } })
    .mockResolvedValueOnce({ data: { data: { data: [], last_page: 1 } } });
  renderApp('/dashboard/contracts');

  expect(await screen.findByRole('heading', { name: 'Contracts Management' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'New Contract' })).toBeTruthy();
});

test('sign-in displays API errors and allows a successful retry', async () => {
  api.get.mockImplementation((path) => {
    if (path === '/me') return Promise.reject({ response: { status: 401 } });
    if (path === '/dashboard/statistics') {
      return Promise.resolve({ data: { success: true, role: 'agent', data: { totals: {} } } });
    }
    throw new Error(`Unexpected GET ${path}`);
  });
  api.post
    .mockRejectedValueOnce({ response: { data: { message: 'Incorrect credentials.' } } })
    .mockResolvedValueOnce({ data: { user: account } });
  const user = userEvent.setup();
  renderApp('/login');

  await user.type(screen.getByLabelText('Email address'), 'agent@example.test');
  await user.type(screen.getByLabelText('Password'), 'test-password');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  expect((await screen.findByRole('alert')).textContent).toContain('Incorrect credentials.');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('heading', { name: 'Overview' })).toBeTruthy();
  expect(screen.getByRole('link', { name: /issue contract/i }).getAttribute('href'))
    .toBe('/dashboard/contracts');
  expect(api.post).toHaveBeenLastCalledWith(
    '/login',
    { email: 'agent@example.test', password: 'test-password' },
    { skipAuthState: true },
  );
});

test('a customer can register and continue to sign-in', async () => {
  api.get.mockRejectedValueOnce({ response: { status: 401 } });
  api.post.mockResolvedValueOnce({ data: { message: 'Registration successful.' } });
  const user = userEvent.setup();
  const fields = [
    ['First name', 'first_name', 'Sam'],
    ['Last name', 'last_name', 'Martin'],
    ['Username', 'username', 'sammartin'],
    ['National ID (CIN)', 'CIN', 'AA12345'],
    ['Phone number', 'phone', '0600000000'],
    ['Email address', 'email', 'sam@example.test'],
    ['Address', 'adresse', '10 Main Street'],
    ['Password', 'password', 'test-password'],
    ['Confirm password', 'password_confirmation', 'test-password'],
  ];
  renderApp('/register');

  for (const [label, , value] of fields) {
    await user.type(screen.getByLabelText(label, { exact: true }), value);
  }
  await user.click(screen.getByRole('button', { name: 'Create account' }));

  expect(api.post).toHaveBeenCalledExactlyOnceWith(
    '/register',
    Object.fromEntries(fields.map(([, field, value]) => [field, value])),
  );
  expect(await screen.findByRole('button', { name: 'Sign in' })).toBeTruthy();
});
