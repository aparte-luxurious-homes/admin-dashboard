# Aparte Admin Dashboard Developer Guide

Welcome to the Aparte Admin Dashboard repository! This is a powerful, high-performance administration portal built with Next.js 15.

## Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **Form Management**: [Formik](https://formik.org/) with [Yup](https://github.com/jquense/yup) validation
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Material UI (MUI)](https://mui.com/)
- **Icons**: [Lucide React](https://lucide.dev/), [Iconify](https://iconify.design/), [Tabler Icons](https://tabler-icons.io/)
- **Charts**: [Chart.js](https://www.chartjs.org/) with [react-chartjs-2](https://react-chartjs-2.js.org/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Error Tracking**: [Sentry](https://sentry.io/)

## Getting Started

### Prerequisites
- Node.js (v20+)
- npm, yarn, or pnpm (yarn is used in this repo)

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd admin-dashboard
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```

### Environment Setup
1. Create a `.env` file:
   ```bash
   cp .env.template .env
   ```
2. Configure the `NEXT_PUBLIC_API_URL` and Sentry DSN if necessary.

## Project Structure
```text
admin-dashboard/
├── public/              # Static assets (logos, icons)
├── src/
│   ├── app/             # App Router pages and layouts
│   ├── components/      # Reusable UI components (Shared, UI, Forms)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Third-party library configurations (QueryClient, Sentry)
│   ├── services/        # API service layer (TanStack Query hooks)
│   ├── store/           # Redux store and slices
│   ├── theme/           # MUI theme and styling constants
│   ├── types/           # TypeScript interfaces and types
│   └── utils/           # Helper functions and formatting utilities
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Available Scripts
- `yarn dev`: Starts the development server on `http://localhost:3000`.
- `yarn build`: Creates an optimized production build.
- `yarn start`: Starts the application in production mode.
- `yarn lint`: Runs ESLint to check for code quality issues.

## Development Workflow
1. **Routing**: Use the `src/app/` directory for routing. Follow Next.js App Router conventions (e.g., `page.tsx`, `layout.tsx`).
2. **Data Fetching**: Use TanStack Query hooks defined in `src/services/`. Do not call axios directly in components; wrap them in hooks for caching and state management.
3. **Forms**: Use Formik for complex forms. Ensure validation is handled via Yup schemas.
4. **UI Components**: Check `src/components/ui/` first before creating new UI elements. Leverage MUI and Tailwind for consistent styling.

## Best Practices
- **Server Components**: Prefer Server Components for data fetching where appropriate to reduce client-side bundle size.
- **Role-Based Access**: Use middleware or layout-level checks for protecting routes based on user roles (Admin, Owner, etc.).
- **Type Safety**: Ensure all API responses have corresponding TypeScript types in `src/types/`.
- **Loading States**: Always implement skeleton screens or loaders for a smooth user experience.
