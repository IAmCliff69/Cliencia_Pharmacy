import { useAuth } from "../../context/AuthContext";

function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-end px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium text-ink leading-tight">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-ink-muted capitalize leading-tight">
              {user.role}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="text-sm text-ink-muted hover:text-danger transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

export default Topbar;