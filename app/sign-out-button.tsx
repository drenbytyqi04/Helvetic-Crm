import { signOut } from "./login/actions";

/** Butoni "Dil" — një formular i vogël që thërret veprimin në server. */
export default function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-white"
      >
        {label}
      </button>
    </form>
  );
}
