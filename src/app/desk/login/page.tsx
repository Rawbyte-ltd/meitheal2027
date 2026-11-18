export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: { index: false } };

/** The page an emailed link opens. Signing in takes a press of the button, so a mail scanner opening the link cannot use it up. */
export default async function Login({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <main className="wrap" style={{ maxWidth: 520, paddingTop: 60 }}>
      <div className="kicker">The reading desk</div>
      <h1>Nearly <em>in</em></h1>
      {t ? <>
        <p className="lead">Press the button to sign in on this device. You will stay signed in here for 30 days.</p>
        <form method="post" action="/api/desk/session" className="sheet copybook">
          <input type="hidden" name="t" value={t} />
          <button className="btn" type="submit">Sign in to the reading desk</button>
        </form>
      </> : <p className="notice">This link is missing its code. <a href="/desk">Ask for a new one.</a></p>}
    </main>
  );
}
