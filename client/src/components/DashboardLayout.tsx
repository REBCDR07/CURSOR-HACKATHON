import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
