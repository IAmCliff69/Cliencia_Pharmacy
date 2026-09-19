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
      {/* Outer shell: fixed to viewport, no overflow */}
      <div className="flex h-screen w-screen overflow-hidden bg-bg">

        {/* Mobile sidebar backdrop */}
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
          />
        )}

        {/* Sidebar — full height, never scrolls */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Right column: flex column, locked to viewport height */}
        <div className="relative z-0 flex flex-1 min-w-0 flex-col h-screen overflow-hidden">

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setIsSidebarOpen((open) => !open)}
            className="fixed left-4 top-4 z-50 grid h-9 w-9 place-items-center rounded-md bg-primary text-[var(--color-brand)] shadow-md md:hidden"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Topbar — fixed height, never scrolls */}
          <Topbar />

          {/* Shiftbar — fixed height, never scrolls */}
          <ShiftBar />

          {/* Main content — this is the ONLY thing that scrolls */}
          <main className="flex-1 overflow-y-auto p-8">
            <Outlet />
          </main>
        </div>

        <ThemeToggle />
      </div>
    </ProtectedRoute>
  );
}

export default AppLayout;