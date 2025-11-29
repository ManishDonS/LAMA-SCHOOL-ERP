import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { MENU_ITEMS, getAccessibleMenuItems, type UserRole, type MenuItem } from '@/utils/permissions'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

interface RolePermissions {
  [module: string]: UserRole[]
}

function PermissionsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [permissions, setPermissions] = useState<RolePermissions>({})
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const roles: UserRole[] = ['super_admin', 'admin', 'teacher', 'student', 'parent', 'staff']

  const menuItems = getAccessibleMenuItems(user?.role)

  useEffect(() => {
    // Check if user is super admin
    if (user && user.role !== 'super_admin') {
      toast.error('Access denied: Only super admins can manage permissions')
      router.push('/dashboard')
      return
    }

    // Load current permissions
    loadPermissions()
  }, [user, router])

  const loadPermissions = () => {
    // Load permissions from MENU_ITEMS
    const currentPermissions: RolePermissions = {}
    MENU_ITEMS.forEach((item) => {
      currentPermissions[item.href] = [...item.roles]
    })
    setPermissions(currentPermissions)
  }

  const togglePermission = (moduleHref: string, role: UserRole) => {
    setPermissions((prev) => {
      const moduleRoles = prev[moduleHref] || []
      const hasRole = moduleRoles.includes(role)

      return {
        ...prev,
        [moduleHref]: hasRole
          ? moduleRoles.filter((r) => r !== role)
          : [...moduleRoles, role],
      }
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // In a real application, this would save to the backend
      // For now, we'll store in localStorage
      localStorage.setItem('custom_permissions', JSON.stringify(permissions))
      toast.success('Permissions updated successfully')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to save permissions')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all permissions to default?')) {
      localStorage.removeItem('custom_permissions')
      loadPermissions()
      setHasChanges(false)
      toast.success('Permissions reset to default')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Role Permissions
            </h1>
            <p className="text-gray-600">Configure which roles can access each module</p>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition shadow-md"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Permissions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Module</th>
                    {roles.map((role) => (
                      <th key={role} className="px-4 py-4 text-center text-sm font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <span className="capitalize">{role.replace('_', ' ')}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {MENU_ITEMS.map((item) => (
                    <tr key={item.href} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <div className="font-semibold text-gray-900">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.href}</div>
                          </div>
                        </div>
                      </td>
                      {roles.map((role) => {
                        const hasAccess = permissions[item.href]?.includes(role) || false
                        return (
                          <td key={role} className="px-4 py-4 text-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={() => togglePermission(item.href, role)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                            </label>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Role Hierarchy</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li><strong>Super Admin:</strong> Full system access, manage schools</li>
                <li><strong>Admin:</strong> Manage school operations</li>
                <li><strong>Teacher:</strong> Manage students, attendance, classes</li>
                <li><strong>Student:</strong> View own data and resources</li>
                <li><strong>Parent:</strong> View child data and fees</li>
                <li><strong>Staff:</strong> Limited administrative access</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Tips</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Check the box to grant access to a module for a specific role</li>
                <li>• Changes are saved to your browser and will persist across sessions</li>
                <li>• Use "Reset to Default" to restore original permissions</li>
                <li>• Ensure each role has access to the Dashboard module</li>
              </ul>
            </div>
          </div>

          {hasChanges && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium">
                ⚠️ You have unsaved changes. Click "Save Changes" to apply them.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function ProtectedPermissionsPage() {
  return (
    <ProtectedRoute>
      <PermissionsPage />
    </ProtectedRoute>
  )
}
