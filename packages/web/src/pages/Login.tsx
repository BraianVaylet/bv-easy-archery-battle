import { LogIn } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Button, FieldError, Input, Label } from '../components/ui';
import { AuthScreen } from './AuthScreen';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ alias, password }, { onSuccess: () => navigate('/', { replace: true }) });
  };

  return (
    <AuthScreen
      title="Iniciar sesión"
      icon={
        <img src="/icon.svg" alt="BV Archery Battle" className="h-20 w-20 rounded-2xl shadow-sm" />
      }
      footer={
        <>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-primary">
            Registrate
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <Label htmlFor="alias">Alias</Label>
          <Input
            id="alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <FieldError>{login.error ? (login.error as Error).message : undefined}</FieldError>

        <Button type="submit" size="lg" loading={login.isPending}>
          <LogIn size={18} aria-hidden /> Entrar
        </Button>

        <Link to="/recover" className="text-center text-muted text-sm hover:text-fg">
          Olvidé mi contraseña
        </Link>
      </form>
    </AuthScreen>
  );
}
