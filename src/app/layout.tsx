export const metadata = { title: "Days per Country" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body style={{maxWidth:900,margin:"0 auto",padding:20}}>
      <nav style={{display:"flex", gap:12, marginBottom:16}}>
        <a href="/">Home</a>
        <a href="/trips">Trips</a>
        <a href="/login">Login</a>
      </nav>
      {children}
    </body></html>
  );
}
