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
- Admin dashboard for viewing all users, all expenses, global spending analytics, and user activities

## Conceptual Entities

- `users`
- `expenses`
- `user_activities`

## Assignment 2 Features

- Modern React-based single-page-style interface
- Backend API routes connected to a SQLite database
- Three conceptual entities: users, expenses, and user activities
- Full expense CRUD operations
- Registration and login with password hashing
- JWT authentication stored in an HttpOnly cookie
- Role-based admin access
- Live search and filters for expense records
- Global admin dashboard with analytics and activity history
- Database export included as `database-export.sql`

## Demo Accounts

The app seeds a demo admin account when the database is created.

### Demo Admin

- Email: `admin@spendly.local`
- Password: `admin123`

The admin account can access the `/admin` page to view all users, all expenses, global spending analytics, and user activity history.

You can also create normal user accounts from the Register page.

The seeded admin credentials can be changed with environment variables:

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
- Admin users also have their own personal expense dashboard.
- The `/admin` page provides a global admin view, including all users, all expenses, spending analytics, and user activity history.
- Future expense dates are blocked by validation.


## Workload Allocation

This assignment was completed individually by Yutong Li.

Main responsibilities:

- Project setup and Next.js application structure
- SQLite database schema and migration setup
- User authentication, password hashing, and JWT handling
- Expense CRUD APIs and dashboard UI
- Recharts spending visualisations
- Live search and filtering
- Admin dashboard, user list, global expenses, and activity history
- README and database export preparation


## Author

Yutong Li
Student ID: 25682865  
This assignment was completed individually.
