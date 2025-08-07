import { Request, Response } from 'express';
import { MessagesResponse, UploadResponse } from '../types/index.js';
import { db } from '../services/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;

    const { messages, total } = await db.getMessages(offset, limit);
    const hasMore = offset + limit < total;

    const response: MessagesResponse = {
      messages,
      hasMore,
      total
    };

    res.json(response);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { content, type, receiverId } = req.body;

    // Validate input
    if (!content || !type || !receiverId) {
      res.status(400).json({ message: 'Content, type, and receiverId are required' });
      return;
    }

    // Create message in database
    const message = await db.createMessage({
      content,
      type,
      sender_id: authReq.userId,
      receiver_id: receiverId,
      created_at: new Date(),
      is_read: false,
      is_delivered: true
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    // Here you would typically upload to Supabase storage
    // For now, we'll simulate the response
    const response: UploadResponse = {
      url: `/uploads/images/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size
    };

    res.json(response);
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file provided' });
      return;
    }

    // Here you would typically upload to Supabase storage
    // For now, we'll simulate the response
    const response: UploadResponse = {
      url: `/uploads/files/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size
    };

    res.json(response);
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
}; 