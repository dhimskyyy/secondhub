// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';

/**
 * Dashboard index page.
 * Redirects to /dashboard/listings as the default sub-page.
 */
export default function DashboardPage() {
  redirect('/dashboard/listings');
}