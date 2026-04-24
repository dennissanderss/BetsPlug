import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NavStateProvider } from "@/components/layout/nav-state-context";
import { AuthGuard } from "@/components/layout/auth-guard";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <NavStateProvider>
      <div data-app-shell className="relative flex h-screen overflow-hidden">
        {/* Ambient glow blobs on the whole shell — span the full viewport
            behind the sidebar, header and main so the dashboard never
            feels like a flat dark rectangle. `pointer-events-none` so
            nothing below them traps clicks. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, rgba(74,222,128,0.22), transparent 70%)",
            filter: "blur(120px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 right-[-10%] h-[480px] w-[480px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)",
            filter: "blur(130px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-10%] left-1/3 h-[440px] w-[440px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)",
            filter: "blur(140px)",
          }}
        />

        <Sidebar />
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      </NavStateProvider>
    </AuthGuard>
  );
}
