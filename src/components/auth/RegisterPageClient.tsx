'use client';

import { useState } from 'react';
import { Palette, User } from 'lucide-react';
import { ClientRegisterForm } from '@/components/auth/ClientRegisterForm';
import { FreelancerRegisterForm } from '@/components/auth/FreelancerRegisterForm';
import { cn } from '@/lib/utils';

export function RegisterPageClient({ initialRole = 'user' }: { initialRole?: 'user' | 'freelancer' }) {
  const [role, setRole] = useState<'user' | 'freelancer'>(initialRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50">
      {/* Two-Option Role Switcher */}
      <div className="pt-6 px-4 flex justify-center">
        <div className="inline-grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white border border-purple-100 shadow-md shadow-purple-900/5 max-w-md w-full">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
              role === 'user'
                ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
            )}
          >
            <User className="h-4 w-4" />
            Client
          </button>

          <button
            type="button"
            onClick={() => setRole('freelancer')}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
              role === 'freelancer'
                ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/60'
            )}
          >
            <Palette className="h-4 w-4" />
            Freelancer
          </button>
        </div>
      </div>

      {role === 'user' ? (
        <ClientRegisterForm embedded />
      ) : (
        <FreelancerRegisterForm embedded />
      )}
    </div>
  );
}
