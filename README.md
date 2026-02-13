# Aparte Admin Dashboard

The administrative engine for the Aparte platform. Built with **Next.js 15** (App Router), **TypeScript**, and **TanStack Query**.

## 🚀 Current State
- **Admin Controls**: Robust user management, property verification workflows, and KYC processing are fully operational.
- **Financial Reporting**: Real-time tracking of transactions, wallets, and settlement history.
- **Architecture**: Leverages Next.js 15 Server Components and TanStack Query for efficient data fetching and state management.

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Data Fetching**: TanStack Query v5
- **Styling**: Tailwind CSS & Material UI (MUI)
- **Forms**: Formik & Yup
- **Charts**: Chart.js

## 📚 Documentation
For detailed developer onboarding, see the [Developer Guide](DEVELOPER_GUIDE.md).

## 🤝 Contributing
We follow high standards for our internal tools. Please adhere to these guidelines:

### 1. Git Workflow
- Branch from `main` or `dev`: `git checkout -b feature/your-feature-name`.
- **Pull Requests**: Create PRs from your feature branch to the `staging` or `dev` branch for review and testing.
- **Production**: Only the **Senior Engineer** is authorized to create PRs to the `prod` branch.
- Use **Conventional Commits**: `feat: ...`, `fix: ...`, `docs: ...`.
- PRs require at least one approval and must pass all CI/CD checks.

### 2. Coding Standards
- **Server vs Client**: Use Server Components for data fetching whenever possible. Mark interactive components with `'use client'`.
- **Hooks**: Use custom hooks for complex logic and API interactions (leveraging TanStack Query).
- **Type Safety**: Use TypeScript interfaces for all components and API responses. Avoid `any` at all costs.
- **Forms**: Use **Formik** for consistent form state management and **Yup** for validation schemas.

---

## 🚀 Quick Start
```bash
# Install yarn if not already installed
npm install -g yarn

# Install dependencies
yarn install

# Setup environment
cp .env.template .env # Update NEXT_PUBLIC_API_URL

# Start dev server
yarn dev
```
