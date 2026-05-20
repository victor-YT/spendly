type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
};

function getInitial(name?: string | null, email?: string | null) {
  const value = name?.trim() || email?.trim() || "U";
  return value.charAt(0).toUpperCase();
}

export default function UserAvatar({ name, email, size = "md" }: UserAvatarProps) {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
        ? "h-20 w-20 text-3xl"
        : "h-9 w-9 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-950 font-semibold text-white shadow-sm ${sizeClass}`}
    >
      {getInitial(name, email)}
    </div>
  );
}
