'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/user-actions'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <Button 
        onClick={handleLogout} 
        variant="ghost" 
        size="sm" 
        className="rounded-full text-[10px] font-black uppercase tracking-widest h-10 px-5 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
    >
        <LogOut className="w-3.5 h-3.5 mr-2" />
        Sign Out
    </Button>
  )
}
