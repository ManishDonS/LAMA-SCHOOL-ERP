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

// Mocks removed. Using Real Data now.

