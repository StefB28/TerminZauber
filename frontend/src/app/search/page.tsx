'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import ClientSearch from './ClientSearch'

export default function SearchPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()

  useEffect(() => {
    // Check if user is authenticated
    if (!token || !user) {
      router.push('/login?redirect=/search')
      return
    }

    // Only allow patients to access search
    if (user.role !== 'PATIENT') {
      router.push('/dashboard')
      return
    }
  }, [token, user, router])

  // Show loading while checking authentication
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Überprüfe Anmeldung...</p>
        </div>
      </div>
    )
  }

  return <ClientSearch />
}
