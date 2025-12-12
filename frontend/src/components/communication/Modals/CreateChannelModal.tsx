import React, { useState } from 'react'

interface CreateChannelModalProps {
    isOpen: boolean
    onClose: () => void
    onCreateChannel: (name: string, type: 'public' | 'private', description: string) => void
    existingChannelNames: string[]
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
    isOpen,
    onClose,
    onCreateChannel,
    existingChannelNames
}) => {
    const [channelName, setChannelName] = useState('')
    const [channelType, setChannelType] = useState<'public' | 'private'>('public')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')

    if (!isOpen) return null

    const validateChannelName = (name: string): boolean => {
        if (!name || name.trim() === '') {
            setError('Channel name is required')
            return false
        }
        if (name.length < 3) {
            setError('Channel name must be at least 3 characters')
            return false
        }
        if (name.length > 50) {
            setError('Channel name must be less than 50 characters')
            return false
        }
        if (!/^[a-z0-9-_]+$/.test(name)) {
            setError('Channel name can only contain lowercase letters, numbers, hyphens, and underscores')
            return false
        }
        if (existingChannelNames.includes(name)) {
            setError('A channel with this name already exists')
            return false
        }
        setError('')
        return true
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const normalizedName = channelName.toLowerCase().trim().replace(/\s+/g, '-')
        
        if (validateChannelName(normalizedName)) {
            onCreateChannel(normalizedName, channelType, description)
            handleClose()
        }
    }

    const handleClose = () => {
        setChannelName('')
        setChannelType('public')
        setDescription('')
        setError('')
        onClose()
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/\s+/g, '-')
        setChannelName(value)
        if (error) {
            validateChannelName(value)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create a Channel</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Channels are where conversations happen around a topic
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Channel Name */}
                    <div>
                        <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Channel Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                                #
                            </span>
                            <input
                                id="channelName"
                                type="text"
                                value={channelName}
                                onChange={handleNameChange}
                                placeholder="e.g., team-announcements"
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
                                    error
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                }`}
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="mt-1 text-sm text-red-500">{error}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Use lowercase letters, numbers, hyphens, and underscores
                        </p>
                    </div>

                    {/* Channel Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Channel Type
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <input
                                    type="radio"
                                    name="channelType"
                                    value="public"
                                    checked={channelType === 'public'}
                                    onChange={(e) => setChannelType('public')}
                                    className="mt-1 mr-3"
                                />
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        # Public
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Anyone in the workspace can view and join
                                    </div>
                                </div>
                            </label>
                            <label className="flex items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <input
                                    type="radio"
                                    name="channelType"
                                    value="private"
                                    checked={channelType === 'private'}
                                    onChange={(e) => setChannelType('private')}
                                    className="mt-1 mr-3"
                                />
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        🔒 Private
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Only invited members can view and join
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this channel about?"
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!channelName.trim()}
                        >
                            Create Channel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
