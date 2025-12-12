import React from 'react'
import { Channel, User } from '../shared/types'

interface ChatSidebarProps {
    channels: Channel[]
    users: User[]
    activeChannelId: string
    onSelectChannel: (channelId: string) => void
    onCreateChannel: () => void
    onCreateDM: () => void
    currentUser: User
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    channels,
    users,
    activeChannelId,
    onSelectChannel,
    onCreateChannel,
    onCreateDM,
    currentUser
}) => {
    const publicChannels = channels.filter(c => c.type === 'public')
    const directMessages = channels.filter(c => c.type === 'direct')

    const getChannelName = (channel: Channel) => {
        if (channel.type === 'direct') {
            // Find the other user in the DM
            const otherUserId = channel.members.find(id => id !== currentUser.id)
            const otherUser = users.find(u => u.id === otherUserId)
            return otherUser ? otherUser.name : 'Unknown User'
        }
        return channel.name
    }

    const getChannelIcon = (channel: Channel) => {
        if (channel.type === 'public') return '#'
        if (channel.type === 'private') return '🔒'
        return '●' // Status indicator placeholder
    }

    const getStatusColor = (status: User['status']) => {
        switch (status) {
            case 'online': return 'bg-green-500'
            case 'away': return 'bg-yellow-500'
            case 'busy': return 'bg-red-500'
            default: return 'bg-gray-400'
        }
    }

    return (
        <div className="w-80 h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Communication</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Channels Section */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channels</h3>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onCreateChannel();
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-all duration-200 font-bold text-lg shadow-sm hover:shadow-md"
                            title="Create Channel"
                            aria-label="Create new channel"
                        >
                            +
                        </button>
                    </div>
                    <div className="space-y-1">
                        {publicChannels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => onSelectChannel(channel.id)}
                                className={`w-full flex items-center px-2 py-1.5 rounded-md transition-colors ${activeChannelId === channel.id
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <span className="text-gray-400 mr-2 text-lg">#</span>
                                <span className="truncate font-medium">{channel.name}</span>
                                {channel.unreadCount > 0 && (
                                    <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {channel.unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Direct Messages Section */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</h3>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onCreateDM();
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-all duration-200 font-bold text-lg shadow-sm hover:shadow-md"
                            title="Start Direct Message"
                            aria-label="Start new direct message"
                        >
                            +
                        </button>
                    </div>
                    <div className="space-y-1">
                        {directMessages.map(channel => {
                            const otherUserId = channel.members.find(id => id !== currentUser.id)
                            const otherUser = users.find(u => u.id === otherUserId) || users[0] // Fallback

                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => onSelectChannel(channel.id)}
                                    className={`w-full flex items-center px-2 py-1.5 rounded-md transition-colors ${activeChannelId === channel.id
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                        : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="relative mr-2">
                                        <img src={otherUser.avatar} alt={otherUser.name} className="w-5 h-5 rounded-full" />
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-gray-50 dark:border-gray-900 rounded-full ${getStatusColor(otherUser.status)}`}></span>
                                    </div>
                                    <span className="truncate font-medium">{otherUser.name}</span>
                                    {channel.unreadCount > 0 && (
                                        <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                            {channel.unreadCount}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <div className="relative">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-gray-50 dark:border-gray-900 rounded-full ${getStatusColor(currentUser.status)}`}></span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.status}</p>
                </div>
            </div>
        </div>
    )
}
