export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt?: Date;
}

export interface UserDB {
  id?: string;
  email: string;
  username: string;
  password_hash: string;
  avatar?: string;
  is_online: boolean;
  last_seen?: Date;
  created_at?: Date;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  senderId: string;
  receiverId: string;
  createdAt: Date;
  isRead: boolean;
  isDelivered: boolean;
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface MessageDB {
  id?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  sender_id: string;
  receiver_id: string;
  created_at: Date;
  is_read: boolean;
  is_delivered: boolean;
  reply_to?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  callType: 'audio' | 'video';
  status: 'pending' | 'active' | 'ended' | 'missed' | 'rejected';
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
}

export interface CallDB extends Omit<Call, 'id'> {
  id?: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  started_at: Date;
  ended_at?: Date;
}

// API Response types
export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  total: number;
}

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
}

// Socket event types
export interface SocketEvents {
  'message:send': (data: { content: string; type: string; receiverId: string }) => void;
  'message:receive': (message: Message) => void;
  'message:typing': (data: { isTyping: boolean; userId: string }) => void;
  'message:read': (data: { messageId: string; userId: string }) => void;
  'user:online': (data: { userId: string; isOnline: boolean }) => void;
  'call:offer': (data: { offer: RTCSessionDescriptionInit; callType: 'audio' | 'video'; from: string }) => void;
  'call:answer': (data: { answer: RTCSessionDescriptionInit; to: string }) => void;
  'call:ice-candidate': (data: { candidate: RTCIceCandidateInit; to: string }) => void;
  'call:hang-up': (data: { to: string }) => void;
  'call:incoming': (data: { from: User; callType: 'audio' | 'video' }) => void;
}

// Auth types
export interface AuthenticatedSocket {
  userId: string;
  user: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
} 