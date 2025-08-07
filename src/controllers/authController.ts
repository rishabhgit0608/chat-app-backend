import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { LoginResponse, RegisterResponse, User } from '../types/index.js';
import { db } from '../services/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      res.status(400).json({ message: 'Email, password, and username are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await db.createUser({
      email,
      username,
      password_hash: passwordHash,
      is_online: false,
      avatar: undefined,
      last_seen: new Date(),
      created_at: new Date()
    });

    // Generate JWT token
    const jwtPayload = { userId: user.id, email: user.email };
    const jwtSecret = process.env.JWT_SECRET!;
    const jwtOptions: SignOptions = { 
      expiresIn: '7d'
    };
    const token = jwt.sign(jwtPayload, jwtSecret, jwtOptions);

    const response: RegisterResponse = { user, token };
    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user
    const userDB = await db.findUserByEmail(email);
    if (!userDB) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userDB.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Update online status
    await db.updateUserOnlineStatus(userDB.id!, true);

    // Convert to User type (remove password_hash)
    const user: User = {
      id: userDB.id!,
      email: userDB.email,
      username: userDB.username,
      avatar: userDB.avatar,
      isOnline: true,
      lastSeen: userDB.last_seen
    };

    // Generate JWT token
    const jwtPayload = { userId: user.id, email: user.email };
    const jwtSecret = process.env.JWT_SECRET!;
    const jwtOptions: SignOptions = { 
      expiresIn: '7d'
    };
    const token = jwt.sign(jwtPayload, jwtSecret, jwtOptions);

    const response: LoginResponse = { user, token };
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    res.json(authReq.user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Update online status
    await db.updateUserOnlineStatus(authReq.userId, false);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Get all users except the current user
    const users = await db.getAllUsers(authReq.userId);
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
}; 