import { signOut } from "./login/actions";

/** Butoni "Dil" — një formular i vogël që thërret veprimin në server. */
export default function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
      >
        {label}
      </button>
    </form>
  );
}
