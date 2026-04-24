import { Bell, Search, User, Menu } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/auth-context';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

type Props = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function Topbar({ setIsOpen }: Props) {
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3 flex-1">
        <button
          className="md:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 transition"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      
        <div className="hidden sm:flex w-full max-w-md items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="h-9 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-white transition"
              placeholder="Buscar paciente, expediente, documento..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button className="relative text-gray-500 hover:bg-gray-100" size="icon" type="button" variant="ghost">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <div className="flex items-center gap-2 border-l border-gray-200 pl-4 hover:bg-gray-50 rounded-lg px-2 py-1 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {session?.user.fullName ?? 'Usuario'}
            </p>
            <p className="text-xs text-gray-500">
              {session?.user.roles[0]?.name ?? 'Sin rol'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
