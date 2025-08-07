import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, UserDB, Message, MessageDB, Call, CallDB } from '../types/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // User operations
  async createUser(userData: Omit<UserDB, 'id'>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: userData.email,
        username: userData.username,
        password_hash: userData.password_hash,
        avatar: userData.avatar,
        is_online: false,
        last_seen: new Date(),
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return this.transformUser(data);
  }

  async findUserByEmail(email: string): Promise<UserDB | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return this.transformUserDB(data);
  }

  async findUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return this.transformUser(data);
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen: new Date()
      })
      .eq('id', userId);

    if (error) throw new Error(`Failed to update user status: ${error.message}`);
  }

  async getAllUsers(excludeUserId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .neq('id', excludeUserId)
      .order('username', { ascending: true });

    if (error) throw new Error(`Failed to get users: ${error.message}`);

    return data.map(user => this.transformUser(user));
  }

  // Message operations
  async createMessage(messageData: Omit<MessageDB, 'id'>): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        content: messageData.content,
        type: messageData.type,
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        created_at: messageData.created_at,
        is_read: messageData.is_read,
        is_delivered: messageData.is_delivered,
        reply_to: messageData.reply_to,
        file_url: messageData.file_url,
        file_name: messageData.file_name,
        file_size: messageData.file_size
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create message: ${error.message}`);
    return this.transformMessage(data);
  }

  async getMessages(offset: number = 0, limit: number = 50): Promise<{ messages: Message[], total: number }> {
    // Get total count
    const { count } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Get messages with pagination
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to get messages: ${error.message}`);

    const messages = data.map(msg => this.transformMessage(msg));
    return { messages, total: count || 0 };
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) throw new Error(`Failed to mark message as read: ${error.message}`);
  }

  // Call operations
  async createCall(callData: Omit<CallDB, 'id'>): Promise<Call> {
    const { data, error } = await this.supabase
      .from('calls')
      .insert({
        caller_id: callData.caller_id,
        receiver_id: callData.receiver_id,
        call_type: callData.call_type,
        status: callData.status,
        started_at: callData.started_at
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create call: ${error.message}`);
    return this.transformCall(data);
  }

  async updateCallStatus(callId: string, status: string, endedAt?: Date): Promise<void> {
    const updateData: any = { status };
    if (endedAt) updateData.ended_at = endedAt;

    const { error } = await this.supabase
      .from('calls')
      .update(updateData)
      .eq('id', callId);

    if (error) throw new Error(`Failed to update call status: ${error.message}`);
  }

  // Transform functions
  private transformUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      avatar: data.avatar,
      isOnline: data.is_online,
      lastSeen: data.last_seen ? new Date(data.last_seen) : undefined,
      createdAt: data.created_at ? new Date(data.created_at) : undefined
    };
  }

  private transformUserDB(data: any): UserDB {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      avatar: data.avatar,
      is_online: data.is_online,
      last_seen: data.last_seen ? new Date(data.last_seen) : undefined,
      password_hash: data.password_hash
    };
  }

  private transformMessage(data: any): Message {
    return {
      id: data.id,
      content: data.content,
      type: data.type,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      createdAt: new Date(data.created_at),
      isRead: data.is_read,
      isDelivered: data.is_delivered,
      replyTo: data.reply_to,
      fileUrl: data.file_url,
      fileName: data.file_name,
      fileSize: data.file_size
    };
  }

  private transformCall(data: any): Call {
    return {
      id: data.id,
      callerId: data.caller_id,
      receiverId: data.receiver_id,
      callType: data.call_type,
      status: data.status,
      startedAt: new Date(data.started_at),
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      duration: data.duration
    };
  }
}

let dbInstance: DatabaseService | null = null;

export const db = {
  get instance(): DatabaseService {
    if (!dbInstance) {
      dbInstance = new DatabaseService();
    }
    return dbInstance;
  },
  
  // Proxy all methods to the instance
  createUser: (...args: Parameters<DatabaseService['createUser']>) => db.instance.createUser(...args),
  findUserByEmail: (...args: Parameters<DatabaseService['findUserByEmail']>) => db.instance.findUserByEmail(...args),
  findUserById: (...args: Parameters<DatabaseService['findUserById']>) => db.instance.findUserById(...args),
  updateUserOnlineStatus: (...args: Parameters<DatabaseService['updateUserOnlineStatus']>) => db.instance.updateUserOnlineStatus(...args),
  getAllUsers: (...args: Parameters<DatabaseService['getAllUsers']>) => db.instance.getAllUsers(...args),
  createMessage: (...args: Parameters<DatabaseService['createMessage']>) => db.instance.createMessage(...args),
  getMessages: (...args: Parameters<DatabaseService['getMessages']>) => db.instance.getMessages(...args),
  markMessageAsRead: (...args: Parameters<DatabaseService['markMessageAsRead']>) => db.instance.markMessageAsRead(...args),
  createCall: (...args: Parameters<DatabaseService['createCall']>) => db.instance.createCall(...args),
  updateCallStatus: (...args: Parameters<DatabaseService['updateCallStatus']>) => db.instance.updateCallStatus(...args),
}; 