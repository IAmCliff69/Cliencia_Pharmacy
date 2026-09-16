import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className={`fixed bottom-4 right-4 z-50 grid h-9 w-9 place-items-center rounded-full shadow-md ring-1 ring-black/10 transition-colors hover:scale-105 ${
        isDark
          ? "bg-[var(--color-brand-accent)] text-[var(--color-brand-contrast)]"
          : "bg-primary text-[var(--color-brand)]"
      }`}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export default ThemeToggle;