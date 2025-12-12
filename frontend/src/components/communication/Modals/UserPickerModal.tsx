import React, { useState, useMemo } from 'react'
import { User } from '../shared/types'

interface UserPickerModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectUser: (userId: string) => void
    users: User[]
    currentUserId: string
    existingDMUserIds: string[] // User IDs that already have DMs
}

export const UserPickerModal: React.FC<UserPickerModalProps> = ({
    isOpen,
    onClose,
    onSelectUser,
    users,
    currentUserId,
    existingDMUserIds
}) => {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter out current user and filter by search query
    // Always call hooks before any conditional returns
    const filteredUsers = useMemo(() => {
        return users
            .filter(user => user.id !== currentUserId)
            .filter(user => {
                if (!searchQuery.trim()) return true
                const query = searchQuery.toLowerCase()
                return (
                    user.name.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.role.toLowerCase().includes(query)
                )
            })
            .sort((a, b) => {
                // Sort by: online first, then alphabetically
                if (a.status === 'online' && b.status !== 'online') return -1
                if (a.status !== 'online' && b.status === 'online') return 1
                return a.name.localeCompare(b.name)
            })
    }, [users, currentUserId, searchQuery])

    const handleSelectUser = (userId: string) => {
        onSelectUser(userId)
        handleClose()
    }

    // Early return AFTER all hooks
    if (!isOpen) return null

    const handleClose = () => {
        setSearchQuery('')
        onClose()
    }

    const getStatusColor = (status: User['status']) => {
        switch (status) {
            case 'online': return 'bg-green-500'
            case 'away': return 'bg-yellow-500'
            case 'busy': return 'bg-red-500'
            default: return 'bg-gray-400'
        }
    }

    const getStatusText = (status: User['status']) => {
        return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const hasExistingDM = (userId: string) => {
        return existingDMUserIds.includes(userId)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Start a Direct Message</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Select a user to start a conversation
                    </p>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or role..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            autoFocus
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchQuery ? 'No users found matching your search' : 'No users available'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user.id)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                                >
                                    {/* Avatar with status */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <span
                                            className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-gray-800 rounded-full ${getStatusColor(user.status)}`}
                                            title={getStatusText(user.status)}
                                        />
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                                {user.name}
                                            </p>
                                            {hasExistingDM(user.id) && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                                    Active DM
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="truncate">{user.email}</span>
                                            <span>•</span>
                                            <span className="flex-shrink-0">{user.role}</span>
                                        </div>
                                    </div>

                                    {/* Status indicator */}
                                    <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        {getStatusText(user.status)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
