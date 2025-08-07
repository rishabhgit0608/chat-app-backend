import { Server, Socket } from 'socket.io';
import { User, Message } from '../types/index.js';
import { authenticateSocket } from '../middleware/auth.js';
import { db } from '../services/database.js';

interface AuthenticatedSocket extends Socket {
  user: User;
}

// Store connected users
const connectedUsers = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, User>(); // socketId -> user

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        return next(new Error('No token provided'));
      }

      const user = await authenticateSocket(token);
      if (!user) {
        return next(new Error('Authentication failed'));
      }

      (socket as AuthenticatedSocket).user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.user;

    console.log(`User ${user.username} connected with socket ${socket.id}`);

    // Store user connection
    connectedUsers.set(user.id, socket.id);
    socketUsers.set(socket.id, user);

    // Update user online status
    db.updateUserOnlineStatus(user.id, true).catch(console.error);

    // Broadcast user online status
    socket.broadcast.emit('user:online', { userId: user.id, isOnline: true });

    // Handle messaging events
    setupMessageHandlers(socket, user, io);

    // Handle WebRTC signaling events
    setupCallHandlers(socket, user, io);

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${user.username} disconnected`);

      // Clean up user connections
      connectedUsers.delete(user.id);
      socketUsers.delete(socket.id);

      // Update user offline status
      await db.updateUserOnlineStatus(user.id, false);

      // Broadcast user offline status
      socket.broadcast.emit('user:online', { userId: user.id, isOnline: false });
    });
  });
};

const setupMessageHandlers = (socket: Socket, user: User, io: Server) => {
  // Handle sending messages
  socket.on('message:send', async (data: { content: string; type: string; receiverId: string; tempId?: string }) => {
    try {
      // Save message to database
      const message = await db.createMessage({
        content: data.content,
        type: data.type as any,
        sender_id: user.id,
        receiver_id: data.receiverId,
        created_at: new Date(),
        is_read: false,
        is_delivered: true
      });

      // Send to receiver if online
      const receiverSocketId = connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:receive', message);
      }

      // Send back to sender for confirmation with tempId for matching
      socket.emit('message:confirmed', { 
        message, 
        tempId: data.tempId 
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('message:typing', (data: { isTyping: boolean; userId: string }) => {
    // Forward typing indicator to other users
    socket.broadcast.emit('message:typing', data);
  });

  // Handle read receipts
  socket.on('message:read', async (data: { messageId: string; userId: string }) => {
    try {
      await db.markMessageAsRead(data.messageId);
      
      // Notify sender that message was read
      socket.broadcast.emit('message:read', data);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });
};

const setupCallHandlers = (socket: Socket, user: User, io: Server) => {
  // Handle call offers
  socket.on('call:offer', (data: { offer: RTCSessionDescriptionInit; callType: 'audio' | 'video'; to: string }) => {
    console.log(`Call offer from ${user.username} to ${data.to}`);
    
    const targetSocketId = connectedUsers.get(data.to);
    if (targetSocketId) {
      console.log(`Forwarding call offer to socket ${targetSocketId}`);
      
      // Send the offer to the target user
      io.to(targetSocketId).emit('call:offer', {
        offer: data.offer,
        callType: data.callType,
        from: user.id
      });

      // Also send incoming call notification
      io.to(targetSocketId).emit('call:incoming', {
        from: user,
        callType: data.callType
      });
    } else {
      console.log(`Target user ${data.to} not found or offline`);
      // Notify caller that user is offline
      socket.emit('call:failed', { reason: 'User is offline' });
    }
  });

  // Handle call answers
  socket.on('call:answer', (data: { answer: RTCSessionDescriptionInit; to: string }) => {
    console.log(`Call answer from ${user.username} to ${data.to}`);
    
    const targetSocketId = connectedUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:answer', {
        answer: data.answer,
        from: user.id
      });
    }
  });

  // Handle ICE candidates
  socket.on('call:ice-candidate', (data: { candidate: RTCIceCandidateInit; to: string }) => {
    const targetSocketId = connectedUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:ice-candidate', {
        candidate: data.candidate,
        from: user.id
      });
    }
  });

  // Handle call hang up
  socket.on('call:hang-up', (data: { to: string }) => {
    const targetSocketId = connectedUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:hang-up', {
        from: user.id
      });
    }
  });

  // Handle call rejection
  socket.on('call:reject', (data: { to: string }) => {
    const targetSocketId = connectedUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call:rejected', {
        from: user.id
      });
    }
  });
}; 