import { SECURITY_QUESTIONS } from '@bv/shared';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Button, FieldError, Input, Label } from '../components/ui';
import { AuthScreen } from './AuthScreen';

const FIRST_QUESTION = SECURITY_QUESTIONS[0]?.id ?? 1;

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestionId, setSecurityQuestionId] = useState(FIRST_QUESTION);
  const [securityAnswer, setSecurityAnswer] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    register.mutate(
      { alias, password, securityQuestionId, securityAnswer },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  };

  return (
    <AuthScreen
      title="Crear cuenta"
      subtitle="Sin email: usás un alias y una pregunta de seguridad para recuperar el acceso."
      footer={
        <>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-primary">
            Iniciá sesión
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
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <Label htmlFor="question">Pregunta de seguridad</Label>
          <select
            id="question"
            value={securityQuestionId}
            onChange={(e) => setSecurityQuestionId(Number(e.target.value))}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-fg"
          >
            {SECURITY_QUESTIONS.map((q) => (
              <option key={q.id} value={q.id}>
                {q.text}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="answer">Respuesta</Label>
          <Input
            id="answer"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            required
          />
        </div>

        <FieldError>{register.error ? (register.error as Error).message : undefined}</FieldError>

        <Button type="submit" size="lg" loading={register.isPending}>
          Crear cuenta
        </Button>
      </form>
    </AuthScreen>
  );
}
