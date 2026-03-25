import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/auth-context';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function Topbar() {
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex max-w-md flex-1 items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 border-0 bg-muted/50 pl-9 focus-visible:ring-1"
            placeholder="Buscar paciente, expediente, documento..."
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button className="relative" size="icon" type="button" variant="ghost">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-clinical-alert" />
        </Button>
        <div className="ml-2 flex items-center gap-2 border-l pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">
              {session?.user.fullName ?? 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground">
              {session?.user.roles[0]?.name ?? 'Sin rol'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
