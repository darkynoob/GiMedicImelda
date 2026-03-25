import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../hooks/auth-context';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, session } = useAuth();
  const [email, setEmail] = useState('valeria.ruiz@nova.mx');
  const [password, setPassword] = useState('Admin123*');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      void navigate('/', { replace: true });
    }
  }, [navigate, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      void navigate('/', { replace: true });
    } catch {
      setError('No pudimos iniciar sesion. Revisa correo y contrasena.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.15fr_0.85fr]">
      <section className="flex flex-col justify-between bg-sidebar px-10 py-12 text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-clinical-info/15">
            <Stethoscope className="h-5 w-5 text-clinical-info" />
          </div>
          <div>
            <p className="text-lg font-semibold text-sidebar-primary">giMedic</p>
            <p className="text-sm text-sidebar-foreground/70">Clinical operations platform</p>
          </div>
        </div>

        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-sidebar-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Acceso seguro
          </div>
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-sidebar-primary">
              La misma capa visual de clinico-nexus, ahora conectada a giMedic.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-sidebar-foreground/70">
              Esta pantalla conserva el lenguaje clínico del proyecto de referencia y
              entra directo al dashboard, pacientes y detalle con la API real del backend.
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-sidebar-foreground/70 sm:grid-cols-2">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-4">
            <p className="font-medium text-sidebar-primary">Usuario seed</p>
            <p className="mt-1">valeria.ruiz@nova.mx</p>
          </div>
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-4">
            <p className="font-medium text-sidebar-primary">Contrasena</p>
            <p className="mt-1">Admin123*</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="clinical-card w-full max-w-md p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Iniciar sesion</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Usa una cuenta activa del tenant para continuar.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                Correo
              </label>
              <Input
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                value={email}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">
                Contrasena
              </label>
              <Input
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </div>

            {error ? (
              <div className="rounded-md border border-clinical-alert/20 bg-clinical-alert/5 px-3 py-2 text-sm text-clinical-alert">
                {error}
              </div>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Entrando...' : 'Entrar al sistema'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
