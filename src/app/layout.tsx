import "./globals.css";

export const metadata = { title: "Days per Country" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-brand">
              <span>🌍</span> Days per Country
            </div>
            <div className="nav-links">
              <a href="/" className="nav-link">Home</a>
              <a href="/trips" className="nav-link">Trips</a>
              <a href="/login" className="nav-link">Login</a>
            </div>
          </div>
        </nav>
        <div className="container main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
