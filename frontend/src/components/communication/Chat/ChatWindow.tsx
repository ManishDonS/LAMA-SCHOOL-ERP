import React, { useState, useRef, useEffect } from 'react'
import { Channel, Message, User, Attachment, Reaction } from '../shared/types'

interface ChatWindowProps {
    channel: Channel
    messages: Message[]
    currentUser: User
    users: User[]
    onSendMessage: (content: string) => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    channel,
    messages,
    currentUser,
    users,
    onSendMessage
}) => {
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim()) {
            onSendMessage(inputValue)
            setInputValue('')
        }
    }

    const getMessageSender = (senderId: string) => {
        return users.find(u => u.id === senderId) || { name: 'Unknown', avatar: '', id: 'unknown' } as User
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="h-16 px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <span className="text-2xl text-gray-400">{channel.type === 'public' ? '#' : channel.type === 'direct' ? '@' : '🔒'}</span>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {channel.type === 'direct'
                                ? users.find(u => channel.members.includes(u.id) && u.id !== currentUser.id)?.name
                                : channel.name}
                        </h2>
                        {channel.description && <p className="text-xs text-gray-500">{channel.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    {/* Add actions like info, search, etc. here if needed */}
                    <button title="Channel Details">ℹ️</button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900">
                {messages.map((message, index) => {
                    const sender = getMessageSender(message.senderId)
                    const isMe = message.senderId === currentUser.id
                    const showHeader = index === 0 || messages[index - 1].senderId !== message.senderId ||
                        new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000

                    return (
                        <div key={message.id} className={`group flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-10">
                                {showHeader && !isMe && (
                                    <img src={sender.avatar} alt={sender.name} className="w-10 h-10 rounded-lg shadow-sm object-cover" />
                                )}
                            </div>

                            {/* Message Content */}
                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {showHeader && (
                                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{sender.name}</span>
                                        <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}
                                <div className={`px-4 py-2 rounded-2xl shadow-sm text-[15px] leading-relaxed ${isMe
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
                                    }`}>
                                    {message.content}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={`Message ${channel.type === 'public' ? '#' + channel.name : '...'}`}
                        className="w-full pl-4 pr-12 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm transition-shadow"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        ➤
                    </button>
                </form>
            </div>
        </div>
    )
}
