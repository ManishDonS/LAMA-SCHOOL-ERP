import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { ChatSidebar } from '@/components/communication/Sidebar/ChatSidebar'
import { ChatWindow } from '@/components/communication/Chat/ChatWindow'
import { CreateChannelModal } from '@/components/communication/Modals/CreateChannelModal'
import { UserPickerModal } from '@/components/communication/Modals/UserPickerModal'
import { Message, Channel, User } from '@/components/communication/shared/types'
import { communicationService } from '@/services/communicationService'

// Temporary mock user until auth is fully integrated for this module
const CURRENT_USER_MOCK: User = {
    id: '1',
    name: 'Manish Lama',
    avatar: 'https://ui-avatars.com/api/?name=Manish+Lama&background=0D8ABC&color=fff',
    status: 'online',
    email: 'manish@lama.edu',
    role: 'Admin'
};

// Mock other users for DM picker (should be an API call)
const OTHER_USERS_MOCK: User[] = [
    CURRENT_USER_MOCK,
    { id: '2', name: 'Sujan Ale', avatar: 'https://ui-avatars.com/api/?name=Sujan+Ale&background=random', status: 'busy', email: 'sujan@lama.edu', role: 'Teacher' },
    { id: '3', name: 'Priya Sharma', avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random', status: 'away', email: 'priya@lama.edu', role: 'Staff' },
];

const CommunicationPage = () => {
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)
    const [activeChannelId, setActiveChannelId] = useState<string>('')
    const [messages, setMessages] = useState<Message[]>([])
    const [channels, setChannels] = useState<Channel[]>([])
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false)
    const [isUserPickerModalOpen, setIsUserPickerModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false);

    // Mock current user (Manish Lama)
    const currentUser = CURRENT_USER_MOCK

    useEffect(() => {
        setIsHydrated(true)
        fetchChannels();
    }, [])

    useEffect(() => {
        if (activeChannelId) {
            fetchMessages(activeChannelId);
        }
    }, [activeChannelId]);

    const fetchChannels = async () => {
        setIsLoading(true);
        try {
            const data = await communicationService.getChannels();
            setChannels(data);
            if (data.length > 0 && !activeChannelId) {
                setActiveChannelId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch channels", error);
        } finally {
            setIsLoading(false);
        }
    }

    const fetchMessages = async (channelId: string) => {
        try {
            const data = await communicationService.getMessages(channelId);
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
            setMessages([]);
        }
    }

    if (!isHydrated) {
        return null
    }

    const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0]

    const handleSendMessage = async (content: string) => {
        if (!activeChannel) return;

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const newMessage: Message = {
            id: tempId,
            channelId: activeChannelId,
            senderId: currentUser.id,
            content,
            timestamp: new Date().toISOString()
        }
        setMessages([...messages, newMessage])

        try {
            await communicationService.sendMessage(activeChannelId, content, currentUser.id);
            // Refresh messages to get real ID and timestamp
            fetchMessages(activeChannelId);
        } catch (error) {
            console.error("Failed to send message", error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    }

    const handleCreateChannel = async (name: string, type: 'public' | 'private', description: string) => {
        try {
            const newChannel = await communicationService.createChannel(name, type, [currentUser.id]);
            setChannels([...channels, newChannel]);
            setActiveChannelId(newChannel.id);
            setIsCreateChannelModalOpen(false);
        } catch (error) {
            console.error("Failed to create channel", error);
        }
    }

    const handleCreateDM = (selectedUserId: string) => {
        // Check if DM already exists with this user
        // Note: Logic needs to adapt if using real backend. 
        // Backend should handle "Get or Create DM".
        // For now, we reuse the createChannel logic if we treat DMs as channels or implement specific DM endpoint later.
        // Assuming we simulate DM creation as a channel for now.

        // This logic mimics previous frontend logic but should ideally be an API call joinOrCreateDM(userId)
        const existingDM = channels.find(
            c => c.type === 'direct' &&
                c.members.includes(currentUser.id) &&
                c.members.includes(selectedUserId)
        )

        if (existingDM) {
            setActiveChannelId(existingDM.id)
        } else {
            // Mock Create DM via channel creation
            communicationService.createChannel(`DM-${selectedUserId}`, 'direct', [currentUser.id, selectedUserId])
                .then(newDM => {
                    setChannels([...channels, newDM]);
                    setActiveChannelId(newDM.id);
                });
        }
        setIsUserPickerModalOpen(false);
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
                <Sidebar />

                <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                    <ChatSidebar
                        channels={channels}
                        users={OTHER_USERS_MOCK}
                        activeChannelId={activeChannelId}
                        onSelectChannel={setActiveChannelId}
                        onCreateChannel={() => setIsCreateChannelModalOpen(true)}
                        onCreateDM={() => setIsUserPickerModalOpen(true)}
                        currentUser={currentUser}
                    />

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center p-6 text-gray-500">
                            Loading chats...
                        </div>
                    ) : activeChannel ? (
                        <ChatWindow
                            channel={activeChannel}
                            messages={messages}
                            currentUser={currentUser}
                            users={OTHER_USERS_MOCK}
                            onSendMessage={handleSendMessage}
                        />
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-6 text-gray-500">
                            Select a channel to start chatting
                        </div>
                    )}
                </div>
            </div>

            <CreateChannelModal
                isOpen={isCreateChannelModalOpen}
                onClose={() => setIsCreateChannelModalOpen(false)}
                onCreateChannel={handleCreateChannel}
                existingChannelNames={existingChannelNames}
            />

            <UserPickerModal
                isOpen={isUserPickerModalOpen}
                onClose={() => setIsUserPickerModalOpen(false)}
                onSelectUser={handleCreateDM}
                users={OTHER_USERS_MOCK}
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

