import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { ChatSidebar } from '@/components/communication/Sidebar/ChatSidebar'
import { ChatWindow } from '@/components/communication/Chat/ChatWindow'
import { CreateChannelModal } from '@/components/communication/Modals/CreateChannelModal'
import { UserPickerModal } from '@/components/communication/Modals/UserPickerModal'
import { MOCK_CHANNELS, MOCK_MESSAGES, MOCK_USERS } from '@/components/communication/shared/types'
import { Message } from '@/components/communication/shared/types'

const CommunicationPage = () => {
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)
    const [activeChannelId, setActiveChannelId] = useState('c1')
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
    const [channels, setChannels] = useState<any[]>(MOCK_CHANNELS)
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false)
    const [isUserPickerModalOpen, setIsUserPickerModalOpen] = useState(false)

    // Mock current user (Manish Lama)
    const currentUser = MOCK_USERS[0]

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    if (!isHydrated) {
        return null
    }

    const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0]
    const channelMessages = messages.filter(m => m.channelId === activeChannelId)

    const handleSendMessage = (content: string) => {
        const newMessage: Message = {
            id: `m${Date.now()}`,
            channelId: activeChannelId,
            senderId: currentUser.id,
            content,
            timestamp: new Date().toISOString()
        }
        setMessages([...messages, newMessage])
    }

    const handleCreateChannel = (name: string, type: 'public' | 'private', description: string) => {
        const newChannel = {
            id: `c${Date.now()}`,
            name: name,
            type: type,
            description: description || `${type === 'public' ? 'Public' : 'Private'} channel`,
            members: [currentUser.id],
            unreadCount: 0
        }
        setChannels([...channels, newChannel])
        setActiveChannelId(newChannel.id)

        // Add a system message to the new channel
        const systemMessage: Message = {
            id: `m${Date.now()}`,
            channelId: newChannel.id,
            senderId: currentUser.id,
            content: `Welcome to #${name}! This channel was created by ${currentUser.name}.`,
            timestamp: new Date().toISOString(),
            isSystem: true
        }
        setMessages([...messages, systemMessage])
    }

    const handleCreateDM = (selectedUserId: string) => {
        // Check if DM already exists with this user
        const existingDM = channels.find(
            c => c.type === 'direct' &&
                c.members.includes(currentUser.id) &&
                c.members.includes(selectedUserId)
        )

        if (existingDM) {
            // Switch to existing DM
            setActiveChannelId(existingDM.id)
        } else {
            // Create new DM
            const selectedUser = MOCK_USERS.find(u => u.id === selectedUserId)
            if (!selectedUser) return

            const newDM = {
                id: `d${Date.now()}`,
                name: selectedUser.name,
                type: 'direct',
                members: [currentUser.id, selectedUserId],
                unreadCount: 0,
                avatar: selectedUser.avatar
            }
            setChannels([...channels, newDM])
            setActiveChannelId(newDM.id)

            // Add a system message to the new DM
            const systemMessage: Message = {
                id: `m${Date.now()}`,
                channelId: newDM.id,
                senderId: currentUser.id,
                content: `Started a conversation with ${selectedUser.name}`,
                timestamp: new Date().toISOString(),
                isSystem: true
            }
            setMessages([...messages, systemMessage])
        }
    }

    const existingChannelNames = channels
        .filter(c => c.type !== 'direct')
        .map(c => c.name)

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            <Head>
                <title>Communication | LAMA School ERP</title>
            </Head>

            <Navbar showBackButton={true} backLink="/dashboard" />

            <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden">
                {/* Main Dashboard Sidebar - hidden on mobile if needed, or collapsed */}
                <Sidebar />

                <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    <ChatSidebar
                        channels={channels}
                        users={MOCK_USERS}
                        activeChannelId={activeChannelId}
                        onSelectChannel={setActiveChannelId}
                        onCreateChannel={() => setIsCreateChannelModalOpen(true)}
                        onCreateDM={() => setIsUserPickerModalOpen(true)}
                        currentUser={currentUser}
                    />

                    <ChatWindow
                        channel={activeChannel}
                        messages={channelMessages}
                        currentUser={currentUser}
                        users={MOCK_USERS}
                        onSendMessage={handleSendMessage}
                    />
                </div>
            </div>

            {/* Create Channel Modal */}
            <CreateChannelModal
                isOpen={isCreateChannelModalOpen}
                onClose={() => setIsCreateChannelModalOpen(false)}
                onCreateChannel={handleCreateChannel}
                existingChannelNames={existingChannelNames}
            />

            {/* User Picker Modal */}
            <UserPickerModal
                isOpen={isUserPickerModalOpen}
                onClose={() => setIsUserPickerModalOpen(false)}
                onSelectUser={handleCreateDM}
                users={MOCK_USERS}
                currentUserId={currentUser.id}
                existingDMUserIds={channels
                    .filter(c => c.type === 'direct' && c.members.includes(currentUser.id))
                    .map(c => c.members.find((id: string) => id !== currentUser.id))
                    .filter(Boolean) as string[]}
            />
        </div>
    )
}

export default CommunicationPage

