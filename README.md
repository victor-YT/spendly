# Spendly

Spendly is a single-page-style expense tracker built for an Internet Programming assignment. It helps users record expenses, view spending charts, and manage their own expense history from a clean dashboard.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- SQLite
- better-sqlite3
- bcryptjs for password hashing
- JSON Web Tokens for authentication
- Tailwind CSS
- Recharts

## Main Features

- Register and log in
- Passwords are hashed before saving
- JWT authentication stored in an HttpOnly cookie
- User and admin roles
- User-owned expenses
- Expense create, read, update, and delete
- Dashboard cards and Recharts visualisations
- Live search by title, category, and description
- User activity logging for register, login, logout, create, update, and delete
- Admin page for viewing users and activities

## Conceptual Entities

- `users`
- `expenses`
- `user_activities`

## Demo Admin

The app seeds a demo admin account when the database is created.

- Email: `admin@spendly.local`
- Password: `admin123`

These can be changed with environment variables:

```bash
SEED_ADMIN_EMAIL=admin@spendly.local
SEED_ADMIN_PASSWORD=admin123
JWT_SECRET=change-this-local-secret
```

For local development, the app has a simple fallback JWT secret. For production, set `JWT_SECRET`.

## How to Run

1. Install dependencies:

```bash
npm install
```

2. Optional: create `.env.local` from `.env.example`.

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

To build the project:

```bash
npm run build
```

To start the production build:

```bash
npm run start
```

## Database

The SQLite database file is created automatically as `expenses.db` when the app runs. The schema is created and migrated in `lib/db.ts`.

For submission, `database-export.sql` contains the database table structure for:

- users
- expenses
- user_activities

Local database runtime files such as `expenses.db`, `expenses.db-shm`, and `expenses.db-wal` are ignored by Git because they contain local test data.

## Folder Structure

- `app/` - Next.js pages, API routes, and UI components
- `app/api/auth/` - register, login, logout, and current-user APIs
- `app/api/expenses/` - protected expense CRUD APIs
- `app/api/admin/` - protected admin APIs
- `app/components/` - dashboard, charts, forms, lists, dialogs, and toasts
- `lib/` - database, authentication, and shared utility functions
- `models/` - database access for users, expenses, and activities
- `public/` - static assets

## Notes

- Normal registration creates a `user` role.
- Admin access is only available to users with role `admin`.
- Normal users can only see and manage their own expenses.
- Admin users can view all expenses through the dashboard and can view all users and activities from `/admin`.

## Author

Yutong Li
