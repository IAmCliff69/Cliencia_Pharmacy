import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ShiftBar from "./ShiftBar";
import ProtectedRoute from "../ProtectedRoute";

function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <div className="flex-1 min-w-0 min-h-screen">
          <Topbar />
          <ShiftBar />
          <main className="min-h-[calc(100vh-70px)] p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AppLayout;