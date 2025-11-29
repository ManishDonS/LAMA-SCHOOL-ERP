import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '@/store/authStore'
import { useLanguage } from '@/context/languageContext'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  emailNotifications: boolean
  pushNotifications: boolean
  language: string
}

export default function UserProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { t, language, setLanguage } = useLanguage()
  const [isHydrated, setIsHydrated] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Profile Form State
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'admin@schoolerp.com',
    phone: '+91-1234567890',
    bio: 'School Administrator',
  })

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: (theme as any) || 'light',
    emailNotifications: true,
    pushNotifications: false,
    language: language,
  })

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userProfile')
      const savedPrefs = localStorage.getItem('userPreferences')
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null

      if (saved) {
        try {
          setProfileData(JSON.parse(saved))
        } catch (error) {
          console.error('Failed to load profile:', error)
        }
      } else if (user) {
        setProfileData({
          firstName: user.firstName || 'John',
          lastName: user.lastName || 'Doe',
          email: user.email || 'admin@schoolerp.com',
          phone: '+91-1234567890',
          bio: 'School Administrator',
        })
      }

      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs))
        } catch (error) {
          console.error('Failed to load preferences:', error)
        }
      }

      if (savedTheme) {
        setTheme(savedTheme)
        setPreferences(prev => ({ ...prev, theme: savedTheme }))
      }

      setIsHydrated(true)
    }
  }, [user])

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/auth/login')
    }
  }, [user, router, isHydrated])

  const handleSaveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(profileData))
    alert(t('profileUpdated'))
    setIsEditing(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences))
    alert(t('settingsSaved'))
  }

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword.trim()) {
      alert('Please enter current password')
      return
    }
    if (!passwordData.newPassword.trim()) {
      alert('Please enter new password')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(t('passwordMismatch'))
      return
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }

    // Password complexity validation
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword)
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword)
    const hasNumber = /[0-9]/.test(passwordData.newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      alert('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
      return
    }

    try {
      // TODO: Implement actual API call to change password
      // Example:
      // const response = await api.post('/api/v1/auth/change-password', {
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword,
      // })

      // For now, just show a warning that this needs backend implementation
      console.warn('Password change requires backend API implementation')
      alert('Password change feature requires backend API implementation. Please implement the /api/v1/auth/change-password endpoint.')

      // Clear the form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswordModal(false)
    } catch (error) {
      console.error('Password change failed:', error)
      alert('Failed to change password. Please try again.')
    }
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any)
    setPreferences({ ...preferences, language: lang })
    localStorage.setItem('userPreferences', JSON.stringify({ ...preferences, language: lang }))
  }

  const handleLogout = async () => {
    if (confirm(t('confirmLogout'))) {
      await logout()
      router.push('/auth/login')
    }
  }

  const menuItems = [
    { href: '/dashboard', label: t('dashboard'), icon: '📊' },
    { href: '/dashboard/students', label: t('students'), icon: '👨‍🎓' },
    { href: '/dashboard/teachers', label: t('teachers'), icon: '👨‍🏫' },
    { href: '/dashboard/guardians', label: t('guardians'), icon: '👨‍👩‍👧' },
    { href: '/dashboard/staff', label: t('staff'), icon: '👔' },
    { href: '/dashboard/attendance', label: t('attendance'), icon: '📋' },
    { href: '/dashboard/fees', label: t('fees'), icon: '💰' },
    { href: '/dashboard/library', label: t('library'), icon: '📚' },
    { href: '/dashboard/classes', label: t('classes'), icon: '🏫' },
    { href: '/dashboard/school-buses', label: t('schoolBuses'), icon: '🚌' },
    { href: '/dashboard/exams', label: t('exams'), icon: '📝' },
    { href: '/dashboard/notifications', label: t('notifications'), icon: '🔔' },
    { href: '/dashboard/reports', label: t('reports'), icon: '📈' },
    { href: '/dashboard/settings', label: t('settings'), icon: '⚙️' },
  ]

  if (!isHydrated || !user) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar showBackButton={true} backLink="/dashboard" />

      {/* Main Content */}
      <div className="flex flex-1">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 py-8 px-6 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('myProfile')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Manage your profile, preferences, and account security</p>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {[
                  { key: 'profile', label: 'Profile', icon: '👤' },
                  { key: 'preferences', label: 'Preferences', icon: '⚙️' },
                  { key: 'security', label: 'Security', icon: '🔒' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-4 font-semibold transition-colors ${activeTab === tab.key
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-8">
                  {!isEditing ? (
                    <div>
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                            {profileData.firstName.charAt(0)}
                            {profileData.lastName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {profileData.firstName} {profileData.lastName}
                            </h3>
                            <p className="text-gray-600">{user?.email}</p>
                            <p className="text-sm text-gray-500 mt-1">Administrator</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                        >
                          {t('editProfile')}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">First Name</h4>
                          <p className="text-lg font-semibold text-gray-900">{profileData.firstName}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">Last Name</h4>
                          <p className="text-lg font-semibold text-gray-900">{profileData.lastName}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">Email</h4>
                          <p className="text-lg font-semibold text-gray-900">{profileData.email}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">Phone</h4>
                          <p className="text-lg font-semibold text-gray-900">{profileData.phone}</p>
                        </div>
                        <div className="col-span-2">
                          <h4 className="text-sm font-semibold text-gray-500 mb-2">Bio</h4>
                          <p className="text-lg font-semibold text-gray-900">{profileData.bio}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                        >
                          {t('save')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-8 space-y-8">
                  {/* Language Setting */}
                  <div className="border-b pb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Language Preference</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { code: 'en', name: 'English' },
                        { code: 'hi', name: 'हिंदी' },
                        { code: 'es', name: 'Español' },
                        { code: 'fr', name: 'Français' },
                        { code: 'de', name: 'Deutsch' },
                        { code: 'pt', name: 'Português' },
                        { code: 'ja', name: '日本語' },
                        { code: 'ar', name: 'العربية' },
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`px-4 py-3 rounded-lg font-semibold transition ${preferences.language === lang.code
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Setting */}
                  <div className="border-b pb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: '☀️ Light Mode', desc: 'Light theme' },
                        { value: 'dark', label: '🌙 Dark Mode', desc: 'Dark theme' },
                        { value: 'system', label: '🖥️ System', desc: 'Follow system' },
                      ].map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={() => {
                            const newTheme = themeOption.value as 'light' | 'dark' | 'system'
                            setTheme(newTheme)
                            setPreferences({ ...preferences, theme: newTheme })
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('theme', newTheme)
                            }
                          }}
                          className={`p-4 rounded-lg border-2 transition ${preferences.theme === themeOption.value
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900 dark:border-blue-500'
                              : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                        >
                          <div className="font-semibold text-gray-900 dark:text-white">{themeOption.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{themeOption.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Email Notifications</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.emailNotifications}
                            onChange={(e) =>
                              setPreferences({ ...preferences, emailNotifications: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Push Notifications</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.pushNotifications}
                            onChange={(e) =>
                              setPreferences({ ...preferences, pushNotifications: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                  >
                    {t('save')}
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Password Management</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Change your password to keep your account secure.
                      </p>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition"
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Login History</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Last login</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Today at 10:30 AM</p>
                          </div>
                          <span className="text-green-600 font-semibold">✓ Current Session</span>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Previous login</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Yesterday at 3:45 PM</p>
                          </div>
                          <span className="text-gray-600 dark:text-gray-400 text-sm">192.168.1.1</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">Add extra security to your account</p>
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-2">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>At least one uppercase letter (A-Z)</li>
                  <li>At least one lowercase letter (a-z)</li>
                  <li>At least one number (0-9)</li>
                  <li>At least one special character (!@#$%^&*...)</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
