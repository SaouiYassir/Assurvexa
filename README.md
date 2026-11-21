# Assurvexa

Assurvexa is an insurance management platform with a React dashboard and a Laravel JSON API. It manages insurance policies, customer contracts, claims, and reimbursements.

| Role | Main workflows |
| --- | --- |
| Administrator | Manage policies and agents, edit customer profiles, and view system-wide activity. |
| Agent | Manage customer profiles and assigned contracts, review assigned claims, and manage reimbursements. |
| Customer | Register, edit their own profile, view their contracts and reimbursements, and submit claims. |

## Project layout

- `Assurvexa-Backend/` contains the API, database migrations, and PHPUnit tests.
- `Assurvexa-Frontend/` contains the React application and Vite configuration.

## Requirements

- PHP 8.2 or newer and Composer 2
- Node.js 20.19+ on the Node 20 line, or Node.js 22.12 or newer, with npm
- PHP's `pdo_sqlite` extension for the default local database and backend tests
- MySQL and PHP's `pdo_mysql` extension if you choose MySQL for local development

## Local setup

### Backend

From the repository root, run these commands for a fresh installation.

```sh
cd Assurvexa-Backend
composer install
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate
php artisan migrate
php artisan serve --host=localhost --port=8000
```

SQLite is the default. If the SQLite file is missing, accept Laravel's prompt to create it. To use MySQL, create an empty database and set `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in the backend `.env` before migrating.

To create the first administrator on a fresh database, configure `ADMIN_AUTO_CREATE=true`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the backend `.env`, then run `php artisan db:seed` before opening public registration. Set `ADMIN_AUTO_CREATE=false` afterward. Customer accounts can register through the frontend, and administrators create agent accounts from the dashboard.

### Frontend

In a second terminal at the repository root, run the frontend.

```sh
cd Assurvexa-Frontend
npm ci
npm run dev -- --host localhost
```

Open `http://localhost:5173`. The frontend defaults to `http://localhost:8000/api`. To use a different API, set `VITE_BACKEND_URL` in `Assurvexa-Frontend/.env.local` and restart Vite. Use the same hostname for both services during local development. If the frontend origin changes, include its exact origin in the backend's `CORS_ALLOWED_ORIGINS` setting.

## Checks

Run the backend tests from `Assurvexa-Backend/`. PHPUnit uses an in-memory SQLite database.

```sh
php vendor/bin/phpunit
```

The feature tests cover cookie authentication, customer registration and profiles, agent administration, the policy catalog, contract validation and assignment, claim review, reimbursement eligibility, and dashboard totals by role.

Run the frontend checks from `Assurvexa-Frontend/`.

```sh
npm test
npm run lint
npm run build
```

Vitest runs React interaction tests in jsdom. The tests cover registration, sign-in, protected routes, contract creation, claim submission, reimbursement, and paginated record selection. They mock API responses and can run without Docker.

## API and deployment notes

- API routes are under `/api`. Login issues an HttpOnly cookie, and the API limits login to five requests per minute per IP. Authenticated browser requests must include credentials.
- Lists return ten records per API page. The dashboard paginates filtered table results, and form dropdowns search the API with their own page controls.
- Keep the backend `.env` private. For an HTTPS deployment, set `APP_ENV=production`, `APP_DEBUG=false`, and `JWT_COOKIE_SECURE=true`. Set the frontend API URL and backend CORS allowlist to your deployment origins.
- Contract deletion is limited to the assigned agent. Deleting a contract also deletes its related claims and reimbursements through database foreign keys.
