// src/app/dashboard/layout.tsx
import DashboardSidebar from '@/components/layout/DashboardSidebar';

/**
 * Dashboard layout shell.
 * Provides sidebar navigation + content area.
 * Auth guard is handled by individual pages (client-side redirect).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <DashboardSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
