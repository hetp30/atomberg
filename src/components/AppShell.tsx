'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { Toaster } from '@/components/ui/sonner'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isPublicRoute = pathname === '/login' || pathname === '/api/seed'

  if (isPublicRoute || !session) {
    return (
      <>
        {children}
        <Toaster richColors position="top-right" />
      </>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-auto">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
