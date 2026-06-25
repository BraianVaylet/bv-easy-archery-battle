import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Layout centrado para las pantallas de autenticación. */
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-5 py-8">
      <Link to="/welcome" className="mb-6 text-muted text-sm hover:text-fg">
        ← BV Archery Battle
      </Link>
      <h1 className="font-semibold text-2xl text-fg">{title}</h1>
      {subtitle && <p className="mt-1 text-muted text-sm">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 text-center text-muted text-sm">{footer}</div>}
    </main>
  );
}
