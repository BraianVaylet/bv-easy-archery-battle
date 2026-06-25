import type { SecurityQuestion } from '@bv/shared';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, FieldError, Input, Label } from '../components/ui';
import { ApiError, api } from '../lib/apiClient';
import { AuthScreen } from './AuthScreen';

export function Recover() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [alias, setAlias] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function fetchQuestion(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      const { question } = await api.get<{ question: SecurityQuestion }>(
        `/auth/recovery/${encodeURIComponent(alias.trim().toLowerCase())}`,
      );
      setQuestion(question.text);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo continuar.');
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      await api.post('/auth/recovery', { alias, answer, newPassword });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo restablecer.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Recuperar acceso"
      subtitle="Respondé tu pregunta de seguridad para definir una nueva contraseña."
      footer={
        <Link to="/login" className="font-medium text-primary">
          Volver al login
        </Link>
      }
    >
      {step === 1 ? (
        <form onSubmit={fetchQuestion} className="flex flex-col gap-4" noValidate>
          <div>
            <Label htmlFor="alias">Alias</Label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              autoCapitalize="none"
              required
            />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" size="lg" loading={busy}>
            Continuar
          </Button>
        </form>
      ) : (
        <form onSubmit={reset} className="flex flex-col gap-4" noValidate>
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-fg text-sm">{question}</p>
          <div>
            <Label htmlFor="answer">Respuesta</Label>
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" size="lg" loading={busy}>
            Restablecer contraseña
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
