import React, { useState } from 'react'
import { Channel, User } from '../shared/types'

interface ChannelDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    channel: Channel
    users: User[] // All available users to select from
    currentUserId: string
    onAddMember: (userId: string) => void
}

export const ChannelDetailsModal: React.FC<ChannelDetailsModalProps> = ({
    isOpen,
    onClose,
    channel,
    users,
    currentUserId,
    onAddMember
}) => {
    const [isAddMode, setIsAddMode] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState('')

    if (!isOpen) return null

    // Filter out users who are already members
    const nonMembers = users.filter(u => !channel.members.includes(u.id))

    const handleAddMember = () => {
        if (selectedUserId) {
            onAddMember(selectedUserId)
            setSelectedUserId('')
            setIsAddMode(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {channel.type === 'public' ? '#' : channel.type === 'private' ? '🔒' : '@'} {channel.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {channel.members.length} members
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {channel.description && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{channel.description}</p>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Members</h3>

                            {!isAddMode && (
                                <button
                                    onClick={() => setIsAddMode(true)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    + Add Member
                                </button>
                            )}
                        </div>

                        {isAddMode && (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Add a user to this channel
                                </label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full mb-3 p-2 border rounded text-sm dark:bg-gray-600 dark:text-white"
                                >
                                    <option value="">Select a user...</option>
                                    {nonMembers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsAddMode(false)}
                                        className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddMember}
                                        disabled={!selectedUserId}
                                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {channel.members.map(memberId => {
                                const user = users.find(u => u.id === memberId)
                                if (!user) return null // Should ideally fetch or show 'Unknown'

                                return (
                                    <div key={memberId} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user.name}
                                                    {user.id === currentUserId && <span className="ml-2 text-xs text-gray-400">(You)</span>}
                                                </p>
                                                <p className="text-xs text-gray-500">{user.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
