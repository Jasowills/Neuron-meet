# Neuron Meet

Real-time video conferencing with WebRTC, React, and NestJS.

## Features

- HD video/audio calls
- Screen sharing
- In-meeting chat
- Host controls
- Guest access
- Mobile responsive

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, Zustand  
**Backend:** NestJS, Socket.io, Prisma, PostgreSQL

## Quick Start

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Set up environment
cp server/.env.example server/.env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run migrations
cd server && npx prisma db push

# Start dev servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |

## License

MIT
