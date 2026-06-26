import { LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AccentPicker } from '../components/AccentPicker';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button, Card } from '../components/ui';

/** Pantalla pública de bienvenida con accesos a login/registro. */
export function Landing() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-5 py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" aria-hidden className="h-9 w-9 rounded-lg" />
          <h1 className="font-semibold text-fg text-xl">BV Archery Battle</h1>
        </div>
        <ThemeToggle />
      </header>

      <Card>
        <p className="text-muted text-sm">
          Organizá y gestioná torneos amistosos de arquería (World Archery). Mobile-first, rápido
          durante el torneo: carga de puntajes en formato WA, podios y estadísticas.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Link to="/register">
            <Button className="w-full" size="lg">
              <UserPlus size={18} aria-hidden /> Crear cuenta
            </Button>
          </Link>
          <Link to="/login">
            <Button className="w-full" variant="secondary" size="lg">
              <LogIn size={18} aria-hidden /> Ya tengo cuenta
            </Button>
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-fg text-sm">Color base</h2>
        <AccentPicker />
      </Card>

      <footer className="mt-auto text-center text-dim text-xs">v{__APP_VERSION__}</footer>
    </main>
  );
}
