import { useRef, useState } from "react";
import { ImagePlus, LogOut } from "lucide-react";
import { uploadProfileImage } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

function Topbar() {
  const { user, refreshProfile, logout } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageChange = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    try {
      await uploadProfileImage(file);
      await refreshProfile();
    } catch (error: any) {
      setUploadError(error?.response?.data?.detail ?? "Could not upload image.");
    }
  };

  return (
    <header className="h-[70px] bg-surface/95 border-b border-border flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Operations overview</p>
        <p className="text-xs text-ink-muted mt-1">Keep today&apos;s pharmacy running smoothly.</p>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 text-right">
            <button
              type="button"
              title="Change profile image"
              aria-label="Change profile image"
              onClick={() => inputRef.current?.click()}
              className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary"
            >
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt="Your profile" className="h-full w-full object-cover" />
              ) : (
                `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
              )}
              <span className="absolute inset-0 hidden place-items-center bg-black/45 text-white group-hover:grid">
                <ImagePlus size={15} />
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleImageChange(event.target.files?.[0])}
            />
            <div>
            <p className="text-sm font-medium text-ink leading-tight">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-ink-muted capitalize leading-tight">
              {user.role}
            </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink-muted hover:border-primary hover:text-primary transition-colors"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
      {uploadError && <p className="absolute right-8 top-[62px] text-xs text-danger">{uploadError}</p>}
    </header>
  );
}

export default Topbar;