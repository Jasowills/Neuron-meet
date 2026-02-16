# Neuron Meet

A modern WebRTC video conferencing platform built with React, NestJS, and Socket.io.

![Neuron Meet](https://via.placeholder.com/800x400?text=Neuron+Meet)

## Features

- **Video Conferencing** - High-quality P2P video calls
- **Screen Sharing** - Share your screen, window, or browser tab
- **Real-time Chat** - In-meeting chat with typing indicators
- **Host Controls** - Mute participants, remove users, lock rooms
- **Guest Access** - Join meetings without an account
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Zustand |
| Backend | NestJS, Socket.io, Prisma |
| Database | PostgreSQL |
| Real-time | WebRTC, Socket.io |
| Auth | JWT, Passport |

## Project Structure

```
neuron-meet/
├── client/            # React frontend
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── shared/    # Shared types
│       └── store/
├── server/            # NestJS backend
│   ├── prisma/
│   └── src/
│       ├── auth/
│       ├── chat/
│       ├── rooms/
│       ├── signaling/
│       ├── shared/    # Shared types
│       └── users/
├── docker/            # Docker configuration
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neuron-meet.git
   cd neuron-meet
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```
   Or manually:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

3. **Set up Supabase**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Go to **Project Settings > Database**
   - Copy the **Connection string** (use "Transaction pooler" for production)

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
   JWT_SECRET="your-secret-key"
   ```

5. **Set up the database**
   ```bash
   npm run db:push
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

### Using Docker (Local Development)

For local development with Docker PostgreSQL:

```bash
docker-compose up -d postgres
```

Then update your `.env`:
```env
DATABASE_URL="postgresql://neuronmeet:neuronmeet@localhost:5432/neuronmeet"
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client and server concurrently |
| `npm run dev:client` | Start frontend only |
| `npm run dev:server` | Start backend only |
| `npm run build` | Build both client and server |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |

### Project Architecture

#### Frontend (`client`)

```
src/
├── components/       # React components
│   ├── meeting/      # Video call components
│   └── common/       # Shared UI components
├── hooks/            # Custom React hooks
├── lib/
│   ├── webrtc/       # WebRTC logic
│   ├── socket/       # Socket.io client
│   └── api/          # API client
├── pages/            # Route pages
├── store/            # Zustand stores
└── styles/           # Global styles
```

#### Backend (`server`)

```
src/
├── auth/             # Authentication module
├── users/            # User management
├── rooms/            # Room management
├── signaling/        # WebRTC signaling gateway
├── chat/             # Chat functionality
└── prisma/           # Database service
```

## WebRTC Flow

1. User joins room via Socket.io
2. Server notifies existing participants
3. New user creates RTCPeerConnection for each participant
4. SDP offers/answers exchanged via signaling server
5. ICE candidates exchanged for NAT traversal
6. Direct P2P media streams established

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/code/:code` - Get room by code
- `PATCH /api/rooms/:id/settings` - Update room settings

## Socket Events

### Client → Server
| Event | Description |
|-------|-------------|
| `join-room` | Join a meeting |
| `leave-room` | Leave meeting |
| `offer` | Send WebRTC offer |
| `answer` | Send WebRTC answer |
| `ice-candidate` | Send ICE candidate |
| `toggle-audio` | Mute/unmute |
| `toggle-video` | Camera on/off |
| `chat-message` | Send chat message |

### Server → Client
| Event | Description |
|-------|-------------|
| `user-joined` | New participant |
| `user-left` | Participant left |
| `offer` | Receive offer |
| `answer` | Receive answer |
| `chat-message` | New message |

## Deployment

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | Token expiry (e.g., "7d") | No |
| `PORT` | Server port | No |
| `TURN_SERVER_URL` | TURN server URL | Production |
| `TURN_USERNAME` | TURN credentials | Production |
| `TURN_PASSWORD` | TURN credentials | Production |



## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

