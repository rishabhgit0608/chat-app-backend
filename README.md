# Chat Application Backend

A real-time chat application backend with WebRTC support, built with Node.js, Express, Socket.IO, and Supabase.

## Features

- 🔐 JWT Authentication (register, login, logout)
- 💬 Real-time messaging with Socket.IO
- 📞 WebRTC signaling for audio/video calls
- 📁 File upload support (images, files)
- 🗄️ Supabase PostgreSQL database
- 🔒 Row Level Security (RLS)
- ⚡ TypeScript support
- 🛡️ Security middleware (helmet, CORS, rate limiting)

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Security**: Helmet, CORS, express-rate-limit

## Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Fill in your environment variables:
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Authentication
JWT_SECRET=your_very_long_random_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

### 2. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the SQL schema from `database-schema.sql`
4. This will create the `users`, `messages`, and `calls` tables with proper relationships and security policies

### 3. Install Dependencies

```bash
npm install
```

### 4. Create Upload Directories

```bash
mkdir -p uploads/images uploads/files
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (protected)
- `POST /auth/logout` - Logout user (protected)

### Messages
- `GET /messages?offset=0&limit=50` - Get chat history (protected)
- `POST /messages` - Send message (protected)

### File Upload
- `POST /upload/image` - Upload image (protected)
- `POST /upload/file` - Upload file (protected)

### Health Check
- `GET /health` - Server health check

## Socket Events

### Client → Server
- `message:send` - Send a message
- `message:typing` - Typing indicator
- `message:read` - Mark message as read
- `call:offer` - WebRTC offer
- `call:answer` - WebRTC answer
- `call:ice-candidate` - ICE candidate
- `call:hang-up` - End call

### Server → Client
- `message:receive` - Receive a message
- `message:typing` - Typing indicator
- `user:online` - User online status
- `call:incoming` - Incoming call
- `call:offer` - WebRTC offer
- `call:answer` - WebRTC answer
- `call:ice-candidate` - ICE candidate
- `call:hang-up` - Call ended

## Development Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build TypeScript to JavaScript
npm run start       # Start production server
npm run start:dev   # Start development server (no hot reload)
```

## Project Structure

```
src/
├── controllers/     # Request handlers
│   ├── authController.ts
│   └── messageController.ts
├── middleware/      # Express middleware
│   └── auth.ts
├── services/        # Business logic
│   └── database.ts
├── socket/          # Socket.IO handlers
│   └── socketHandlers.ts
├── types/           # TypeScript definitions
│   └── index.ts
└── app.ts           # Main application
```

## Deployment

### Oracle Cloud VM (Free Tier)

1. Create an Oracle Cloud Always Free VM
2. Install Node.js and PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

3. Clone your repository and install dependencies:
```bash
git clone <your-repo>
cd backend
npm install
npm run build
```

4. Set up environment variables and start with PM2:
```bash
cp .env.example .env
# Edit .env with your production values
pm2 start dist/app.js --name chat-backend
pm2 startup
pm2 save
```

5. Set up NGINX reverse proxy:
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/chat-app
```

NGINX config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt (12 rounds)
- CORS protection
- Helmet security headers
- Rate limiting
- Row Level Security (RLS) in database
- Input validation
- File upload restrictions

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anon key | Required |
| `SUPABASE_SERVICE_KEY` | Supabase service key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `MAX_FILE_SIZE` | Max file upload size | 10485760 (10MB) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License 