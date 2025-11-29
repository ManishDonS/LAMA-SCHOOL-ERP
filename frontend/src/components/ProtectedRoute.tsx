import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import { canAccessRoute } from '@/utils/permissions'
import toast from 'react-hot-toast'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      // User not logged in
      router.push('/auth/login')
      return
    }

    const currentPath = router.pathname

    // Check if user has permission to access this route
    if (!canAccessRoute(user.role, currentPath)) {
      toast.error('Access denied: You do not have permission to access this page')
      router.push('/dashboard')
      setIsLoading(false)
      return
    }

    // User is authorized
    setIsAuthorized(true)
    setIsLoading(false)
  }, [user, router])

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
