import type { JSX } from 'react';
import { Link, Outlet } from 'react-router-dom';

interface NavItem {
  readonly label: string;
  readonly to: string;
}

interface DashboardShellProps {
  readonly title: string;
  readonly navItems: ReadonlyArray<NavItem>;
}

const DashboardShell = ({ title, navItems }: DashboardShellProps): JSX.Element => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold">{title}</span>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="border-border hidden w-64 shrink-0 border-r p-4 md:block">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <footer className="border-border text-muted-foreground border-t py-4 text-center text-sm">
        © {new Date().getFullYear()} {title}
      </footer>
    </div>
  );
};

export default DashboardShell;
