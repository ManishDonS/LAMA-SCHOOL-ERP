export interface User {
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    email: string;
    role: string;
}

export interface Attachment {
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
    size: number;
}

export interface Reaction {
    emoji: string;
    userId: string;
    count: number;
}

export interface Message {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    timestamp: string;
    attachments?: Attachment[];
    reactions?: Reaction[];
    isSystem?: boolean;
}

export interface Channel {
    id: string;
    name: string;
    type: 'public' | 'private' | 'direct';
    description?: string;
    members: string[]; // User IDs
    lastMessage?: Message;
    unreadCount: number;
    avatar?: string; // For DM or group custom avatar
    isMuted?: boolean;
}

// Dummy Data for Initial Development
export const MOCK_USERS: User[] = [
    { id: '1', name: 'Manish Lama', avatar: 'https://ui-avatars.com/api/?name=Manish+Lama&background=0D8ABC&color=fff', status: 'online', email: 'manish@lama.edu', role: 'Admin' },
    { id: '2', name: 'Sujan Ale', avatar: 'https://ui-avatars.com/api/?name=Sujan+Ale&background=random', status: 'busy', email: 'sujan@lama.edu', role: 'Teacher' },
    { id: '3', name: 'Priya Sharma', avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=random', status: 'away', email: 'priya@lama.edu', role: 'Staff' },
];

export const MOCK_CHANNELS: Channel[] = [
    { id: 'c1', name: 'general', type: 'public', description: 'General announcements and discussion', members: ['1', '2', '3'], unreadCount: 0 },
    { id: 'c2', name: 'staff-room', type: 'private', description: 'Private channel for staff members', members: ['1', '2', '3'], unreadCount: 3 },
    { id: 'd1', name: 'Sujan Ale', type: 'direct', members: ['1', '2'], unreadCount: 1, avatar: MOCK_USERS[1].avatar },
];

export const MOCK_MESSAGES: Message[] = [
    { id: 'm1', channelId: 'c1', senderId: '1', content: 'Welcome to the new communication module!', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'm2', channelId: 'c1', senderId: '2', content: 'This looks great! Much better than the old system.', timestamp: new Date(Date.now() - 86000000).toISOString() },
    { id: 'm3', channelId: 'c1', senderId: '3', content: 'I agree, the separate page layout is very clean.', timestamp: new Date(Date.now() - 85000000).toISOString() },
];
