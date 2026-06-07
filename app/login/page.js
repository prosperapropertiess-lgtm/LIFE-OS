export const dynamic = "force-dynamic";

export default function Login({ searchParams }) {
  const error = searchParams?.error;
  return (
    <div className="wrap">
      <div className="login-box">
        <h1>Life OS</h1>
        <p>Enter your password to continue.</p>
        <form method="post" action="/api/login">
          <input
            type="password"
            name="password"
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
          />
          <button className="primary" type="submit">Log in</button>
          {error ? <p className="err">Wrong password — try again.</p> : null}
        </form>
      </div>
    </div>
  );
}
