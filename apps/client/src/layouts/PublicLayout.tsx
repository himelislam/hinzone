import type { JSX } from 'react';
import { Link, Outlet } from 'react-router-dom';

const PublicLayout = (): JSX.Element => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold">
            Stock Investment Platform
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm">
              Login
            </Link>
            <Link to="/register" className="text-sm">
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-border text-muted-foreground border-t py-6 text-center text-sm">
        © {new Date().getFullYear()} Stock Investment Platform
      </footer>
    </div>
  );
};

export default PublicLayout;
