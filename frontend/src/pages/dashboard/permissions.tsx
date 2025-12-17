import React, { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import { schoolAPI } from '@/services/api'
import { Role, Permission } from '@/types'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

interface RolePermissionsMap {
  [roleId: string]: string[] // List of permission slugs for each role
}

function PermissionsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionsList, setPermissionsList] = useState<Permission[]>([])
  // Group permissions by module for UI display
  const [groupedPermissions, setGroupedPermissions] = useState<{ [module: string]: Permission[] }>({})

  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [originalPermissions, setOriginalPermissions] = useState<RolePermissionsMap>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [creatingRole, setCreatingRole] = useState(false)

  useEffect(() => {
    // Check if user has access (school admin or super admin)
    if (user && !['super_admin', 'admin'].includes(user.role)) {
      toast.error('Access denied')
      router.push('/dashboard')
      return
    }

    if (user?.schoolId) {
      fetchData(user.schoolId.toString())
    }
  }, [user, router])

  const fetchData = async (schoolId: string) => {
    try {
      setLoading(true)
      const [rolesRes, permsRes, schoolRes] = await Promise.all([
        schoolAPI.listRoles(schoolId),
        schoolAPI.listPermissions(schoolId),
        schoolAPI.get(schoolId)
      ])

      const fetchedRoles: Role[] = rolesRes.data
      let fetchedPerms: Permission[] = permsRes.data
      const schoolModulePermissions = schoolRes.data.module_permissions || {}

      // Filter permissions based on school's active modules
      fetchedPerms = fetchedPerms.filter(perm => {
        // If module mapping exists, check if it's enabled for the school
        const modulePerms = schoolModulePermissions[perm.module]
        // If module entry exists, check if at least one action is enabled
        if (modulePerms) {
          return modulePerms.read || modulePerms.create || modulePerms.update || modulePerms.delete
        }
        // If no entry in school config, assume enabled (or disabled? Safe to assume enabled for core/unmapped modules)
        // However, for mapped modules like 'students', if key is missing, it might mean disabled.
        // Let's assume if it's a known module key but missing, it's disabled.
        // But we need to know if 'perm.module' is a known module key.
        // For now, let's keep it simple: if the module key exists in the permission config, we check it.
        // If it DOESN'T exist, we might want to show it (e.g. system permissions).
        return true
      })

      setRoles(fetchedRoles)
      setPermissionsList(fetchedPerms)

      // Group permissions by module
      const grouped: { [module: string]: Permission[] } = {}
      fetchedPerms.forEach(p => {
        if (!grouped[p.module]) grouped[p.module] = []
        grouped[p.module].push(p)
      })
      setGroupedPermissions(grouped)

      // Map initial permissions
      const initialMap: RolePermissionsMap = {}
      fetchedRoles.forEach(r => {
        initialMap[r.id] = r.permissions || []
      })
      setRolePermissions(initialMap)
      setOriginalPermissions(JSON.parse(JSON.stringify(initialMap)))

    } catch (error) {
      console.error(error)
      toast.error('Failed to load roles and permissions')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (roleId: string, slug: string) => {
    setRolePermissions(prev => {
      const current = prev[roleId] || []
      const hasPerm = current.includes(slug)

      const updated = hasPerm
        ? current.filter(s => s !== slug)
        : [...current, slug]

      return {
        ...prev,
        [roleId]: updated
      }
    })
  }

  const hasChanges = () => {
    return JSON.stringify(rolePermissions) !== JSON.stringify(originalPermissions)
  }

  const handleSave = async () => {
    if (!user?.schoolId) return
    setSaving(true)

    // Find modified roles
    const modifiedRoleIds = Object.keys(rolePermissions).filter(roleId => {
      const original = originalPermissions[roleId] || []
      const current = rolePermissions[roleId] || []

      // Simple comparison (arrays might be different order, but usually fine here)
      // Better: compare sorted JSON strings
      return JSON.stringify(original.sort()) !== JSON.stringify(current.sort())
    })

    try {
      // Update each modified role
      await Promise.all(modifiedRoleIds.map(roleId => {
        const role = roles.find(r => r.id === roleId)
        if (!role) return Promise.resolve()

        return schoolAPI.updateRole(user.schoolId.toString(), roleId, {
          name: role.name, // Keep existing name
          description: role.description, // Keep existing description
          permissions: rolePermissions[roleId]
        })
      })) // Concurrent updates might hit rate limits or DB locks, but for few roles it's fine.

      toast.success('Permissions updated successfully')
      setOriginalPermissions(JSON.parse(JSON.stringify(rolePermissions)))
      // Ideally re-fetch to sync
      fetchData(user.schoolId.toString())
    } catch (error) {
      console.error(error)
      toast.error('Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Discard unsaved changes?')) {
      setRolePermissions(JSON.parse(JSON.stringify(originalPermissions)))
      toast.success('Changes discarded')
    }
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.schoolId || !newRoleName) return

    setCreatingRole(true)
    try {
      await schoolAPI.createRole(user.schoolId.toString(), {
        name: newRoleName,
        description: newRoleDescription,
        permissions: [] // Start with no permissions
      })
      toast.success('Role created successfully')
      setShowCreateModal(false)
      setNewRoleName('')
      setNewRoleDescription('')
      fetchData(user.schoolId.toString())
    } catch (error) {
      console.error(error)
      toast.error('Failed to create role')
    } finally {
      setCreatingRole(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!user?.schoolId) return
    if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) return

    try {
      await schoolAPI.deleteRole(user.schoolId.toString(), roleId)
      toast.success('Role deleted successfully')
      fetchData(user.schoolId.toString())
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete role')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 py-8 px-6 overflow-x-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Role Permissions</h1>
              <p className="text-gray-600 mt-1">Manage access control for your school roles</p>
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Permissions for disabled modules are hidden. Enable them in School Settings &gt; Module Activation.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition shadow"
              >
                + Create Role
              </button>
              <button
                onClick={handleReset}
                disabled={!hasChanges() || saving}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-white disabled:opacity-50 transition"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges() || saving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition shadow"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 min-w-[200px] sticky left-0 bg-gray-50">Permission</th>
                    {roles.map(role => (
                      <th key={role.id} className="px-4 py-4 text-center font-semibold text-gray-700 min-w-[120px] group">
                        <div className="flex flex-col items-center">
                          <span className="capitalize">{role.name}</span>
                          {role.is_system && <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full mt-1 text-gray-600">System</span>}
                          {!role.is_system && (
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="mt-1 text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Role"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <Fragment key={module}>
                      <tr className="bg-blue-50/50">
                        <td colSpan={roles.length + 1} className="px-6 py-2 font-bold text-blue-800 uppercase text-xs tracking-wider">
                          Module: {module}
                        </td>
                      </tr>
                      {perms.map(perm => (
                        <tr key={perm.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 sticky left-0 bg-white">
                            <div className="font-medium text-gray-900">{perm.description}</div>
                            <div className="text-xs text-gray-400 font-mono">{perm.slug}</div>
                          </td>
                          {roles.map(role => {
                            const hasAccess = rolePermissions[role.id]?.includes(perm.slug) || false
                            // Admin always has all permissions (usually), but simpler to just show checked if they have it
                            // For System Admin role, maybe disable uncheck?
                            // For now, let's allow editing everything except maybe if it breaks access.
                            const isAdmin = role.name === 'admin'

                            return (
                              <td key={`${role.id}-${perm.id}`} className="px-4 py-3 text-center">
                                <label className="inline-flex items-center justify-center w-full h-full cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hasAccess}
                                    onChange={() => togglePermission(role.id, perm.slug)}
                                    // disabled={isAdmin} // Uncomment if we want to lock Admin permissions
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </label>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create New Role</h2>
            <form onSubmit={handleCreateRole}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="e.g. library_manager"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Use lowercase and underscores</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="What is this role for?"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {creatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
