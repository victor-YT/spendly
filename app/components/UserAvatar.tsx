type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
};

function getInitial(name?: string | null, email?: string | null) {
  const value = name?.trim() || email?.trim() || "U";
  return value.charAt(0).toUpperCase();
}

export default function UserAvatar({ name, email }: UserAvatarProps) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-sm">
      {getInitial(name, email)}
    </div>
  );
}
