export const metadata = { title: "Days per Country" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body style={{margin:0, padding:0}}>
      <nav style={{display:"flex", gap:12, marginBottom:16, padding: "20px 20px 0 20px"}}>
        <a href="/">Home</a>
        <a href="/trips">Trips</a>
        <a href="/login">Login</a>
      </nav>
      {children}
    </body></html>
  );
}
