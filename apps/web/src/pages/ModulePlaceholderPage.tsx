import { FolderOpen } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';

export function ModulePlaceholderPage({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="clinical-card p-10">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Sin datos conectados por ahora</p>
              <p className="text-xs text-muted-foreground">
                La UI ya respeta la estructura del proyecto de referencia y este
                modulo quedo listo para conectarse cuando se expongan los datos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
