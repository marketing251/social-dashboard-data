import { login } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form
        action={login}
        className="card p-10 w-full max-w-sm flex flex-col gap-3"
      >
        <div className="text-4xl text-center mb-2">&#128274;</div>
        <h1 className="text-xl font-bold text-center mb-1">Dashboard Login</h1>
        <p className="text-sm text-text-muted text-center mb-4">
          Sign in to view analytics
        </p>

        <input type="hidden" name="next" value={searchParams.next ?? ''} />

        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 rounded-sm border border-border bg-bg text-text outline-none focus:border-accent"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-sm border border-border bg-bg text-text outline-none focus:border-accent"
        />

        <button
          type="submit"
          className="w-full py-3 rounded-sm bg-accent text-white font-semibold hover:opacity-90 transition"
        >
          Sign In
        </button>

        {searchParams.error && (
          <p className="text-red text-xs text-center mt-2">
            {searchParams.error}
          </p>
        )}
      </form>
    </main>
  );
}
