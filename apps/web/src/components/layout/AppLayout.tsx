import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { useState } from 'react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <AppSidebar isOpen={isOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar setIsOpen={setIsOpen} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
