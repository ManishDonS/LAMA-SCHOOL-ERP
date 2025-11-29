import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@store/authStore'
import Pluggable from '../core/Pluggable' // Import Pluggable

const DefaultHomePageContent: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">School ERP</h1>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

export default function Home() {
  const router = useRouter()
  const { user, restoreSession } = useAuthStore()

  useEffect(() => {
    const initializeAuth = async () => {
      await restoreSession()
    }

    initializeAuth()
  }, [restoreSession])

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    } else {
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'admin':
          router.push('/dashboard/admin')
          break
        case 'teacher':
          router.push('/dashboard/teacher')
          break
        case 'student':
          router.push('/dashboard/student')
          break
        case 'parent':
          router.push('/dashboard/parent')
          break
        default:
          router.push('/dashboard')
      }
    }
  }, [user, router])

  return (
    <Pluggable componentName="HomePageContent" defaultComponent={DefaultHomePageContent} />
  )
}
