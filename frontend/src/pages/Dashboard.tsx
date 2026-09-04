import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-ink mb-1">
        Welcome back{user ? `, ${user.first_name}` : ""}
      </h1>
      <p className="text-ink-muted text-sm">
        Here's what's happening in your pharmacy today.
      </p>

      <div className="mt-6 p-6 bg-surface border border-border rounded-lg text-ink-muted text-sm">
        Low-stock alerts, expiring-soon warnings, and today's sales summary
        will appear here once we build them out in later phases.
      </div>
    </div>
  );
}

export default Dashboard;