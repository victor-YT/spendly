# Spendly

## Overview

Spendly is a production-style expense tracker dashboard built as a Single Page Application with Next.js, TypeScript, SQLite, Tailwind CSS, and Recharts. It provides a fast, responsive interface for recording, managing, and visualizing expenses without full page reloads.

## Problem

Managing expenses in spreadsheets or basic forms is often repetitive, difficult to maintain, and lacks clear visibility into spending patterns. Spendly addresses this by combining expense management and analytics in one streamlined dashboard.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- SQLite with better-sqlite3


## Features

- Full CRUD operations for expenses
- SPA-style experience with instant UI updates
- SQLite-backed persistent storage
- Dashboard summary cards for key metrics
- Spending insights with category and daily charts
- Inline expense editing
- Delete confirmation dialog
- Toast notifications for user feedback
- Loading states, empty states, and validation handling
- Responsive SaaS-style dashboard UI

## Folder Structure

- `app/` – pages, API routes, global styles, and dashboard components
- `app/api/expenses/` – expense CRUD API endpoints
- `app/components/` – reusable UI components
- `lib/` – database setup and shared utilities
- `models/` – expense model and database access logic
- `public/` – static assets

## Challenges

- Delivering a smooth SPA experience within the Next.js App Router
- Keeping client state in sync after create, update, and delete actions
- Structuring SQLite access cleanly with a lightweight model layer
- Aggregating expense data for charts and summary metrics
- Maintaining polished UX across loading, empty, and error states
- Managing real-time UI consistency with optimistic updates

## How to Run

1. Install dependencies:
   `npm install`
2. Start the development server:
   `npm run dev`
3. Open `http://localhost:3000` in your browser

The SQLite database file is created as `expenses.db` and the required table is initialized automatically on first run.

To run a production build:

1. Build the application:
   `npm run build`
2. Start the production server:
   `npm run start`

## Author

Yutong Li