import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ShiftBar from "./ShiftBar";
import ProtectedRoute from "../ProtectedRoute";
import ThemeToggle from "../ThemeToggle";

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-bg">
        {isSidebarOpen && (
          <button type="button" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/30 md:hidden" />
        )}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="relative z-0 flex-1 min-w-0 min-h-screen">
          <button type="button" aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"} onClick={() => setIsSidebarOpen((open) => !open)} className="fixed left-4 top-4 z-50 grid h-9 w-9 place-items-center rounded-md bg-primary text-[var(--color-brand)] shadow-md md:hidden">
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Topbar />
          <ShiftBar />
          <main className="min-h-[calc(100vh-70px)] p-8">
            <Outlet />
          </main>
        </div>
        <ThemeToggle />
      </div>
    </ProtectedRoute>
  );
}

export default AppLayout;