import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { ChatSidebar } from '@/components/communication/Sidebar/ChatSidebar'
import { ChatWindow } from '@/components/communication/Chat/ChatWindow'
import { CreateChannelModal } from '@/components/communication/Modals/CreateChannelModal'
import { UserPickerModal } from '@/components/communication/Modals/UserPickerModal'
import { ChannelDetailsModal } from '@/components/communication/Modals/ChannelDetailsModal'
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
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false);
    // Use state for specific users list, though we might still fallback initially if needed.
    const [availableUsers, setAvailableUsers] = useState<User[]>(OTHER_USERS_MOCK) // Initial mock fallback to avoid empty UI

    // Mock current user (Manish Lama) - In real app, this comes from auth context/hook
    const currentUser = CURRENT_USER_MOCK

    useEffect(() => {
        setIsHydrated(true)
        fetchChannels();
        fetchUsers();
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
            setError("Failed to load channels");
        } finally {
            setIsLoading(false);
        }
    }

    const fetchUsers = async () => {
        try {
            const data = await communicationService.getUsers();
            if (data && data.length > 0) {
                // Ensure current user is not in "available users" list for DMs if we filter later?
                // But for now just replace mock.
                // Also ensure currentUser details are up to date if we were finding it from this list.
                setAvailableUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
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

    const handleCreateChannel = async (name: string, type: 'public' | 'private', description: string, members: string[]) => {
        try {
            const newChannel = await communicationService.createChannel(name, type, members);
            setChannels([...channels, newChannel]);
            setActiveChannelId(newChannel.id);
            setIsCreateChannelModalOpen(false);
        } catch (error) {
            console.error("Failed to create channel", error);
        }
    }

    const handleAddMember = async (userId: string) => {
        if (!activeChannelId) return;
        try {
            await communicationService.addMember(activeChannelId, userId);
            // Update local state by adding member to channel
            setChannels(prev => prev.map(c =>
                c.id === activeChannelId
                    ? { ...c, members: [...c.members, userId] }
                    : c
            ));
        } catch (error) {
            console.error("Failed to add member", error);
            alert("Failed to add member");
        }
    }

    const handleCreateDM = (selectedUserId: string) => {
        // Check if DM already exists with this user
        const existingDM = channels.find(
            c => c.type === 'direct' &&
                c.members.includes(currentUser.id) &&
                c.members.includes(selectedUserId)
        )

        if (existingDM) {
            setActiveChannelId(existingDM.id)
        } else {
            // Create DM
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

    // Filter availableUsers to remove current user for display purposes where needed, 
    // or keep all. Logic depends on usage.
    // For ChatWindow users prop (used for resolving names), pass all.
    // For UserPicker (DMs), pass all (Modal filters current user out).

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
                        users={availableUsers}
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
                            users={availableUsers}
                            onSendMessage={handleSendMessage}
                            onViewDetails={() => setIsDetailsModalOpen(true)}
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
                users={availableUsers}
                currentUserId={currentUser.id}
            />

            <UserPickerModal
                isOpen={isUserPickerModalOpen}
                onClose={() => setIsUserPickerModalOpen(false)}
                onSelectUser={handleCreateDM}
                users={availableUsers}
                currentUserId={currentUser.id}
                existingDMUserIds={channels
                    .filter(c => c.type === 'direct' && c.members.includes(currentUser.id))
                    .map(c => c.members.find((id: string) => id !== currentUser.id))
                    .filter(Boolean) as string[]}
            />

            {activeChannel && (
                <ChannelDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    channel={activeChannel}
                    users={availableUsers}
                    currentUserId={currentUser.id}
                    onAddMember={handleAddMember}
                />
            )}
        </div>
    )
}

export default CommunicationPage

