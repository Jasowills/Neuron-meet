# Neuron Meet - WebRTC Video Chat Platform

## Project Overview

**Neuron Meet** is a modern video conferencing platform inspired by Zoom and Google Meet, featuring peer-to-peer video calls, screen sharing, and real-time chat functionality.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | UI components and state management |
| Styling | Tailwind CSS | Modern, responsive design |
| State | Zustand | Lightweight state management |
| Backend | NestJS | API server and WebSocket gateway |
| Real-time | Socket.io | Signaling server for WebRTC |
| Media | WebRTC | P2P audio/video/screen sharing |
| Database | PostgreSQL | User data, room persistence |
| ORM | Prisma | Database operations |
| Auth | JWT + Passport | Authentication |
| TURN/STUN | Coturn (self-hosted) or Twilio | NAT traversal |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Video Grid  │  │  Chat Panel  │  │   Controls   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    WebRTC Media Manager                       │  │
│  │  - getUserMedia() - RTCPeerConnection - MediaStream handling  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Socket.io Client                           │  │
│  │  - Signaling - Chat messages - Presence - Room events        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ WebSocket + HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER (NestJS)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   REST API       │  │  WebSocket       │  │   Auth Module    │  │
│  │   Controller     │  │  Gateway         │  │   (JWT/Passport) │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Room Manager Service                       │  │
│  │  - Room creation - Participant tracking - ICE coordination   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Prisma ORM + PostgreSQL                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ STUN/TURN
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TURN/STUN Server (Coturn)                        │
│  - NAT traversal - Relay for symmetric NAT                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## WebRTC Signaling Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  User A  │                    │  Server  │                    │  User B  │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ 1. join-room                  │                               │
     │──────────────────────────────>│                               │
     │                               │ 2. user-joined                │
     │                               │──────────────────────────────>│
     │                               │                               │
     │ 3. Create RTCPeerConnection   │                               │
     │ 4. createOffer()              │                               │
     │ 5. setLocalDescription()      │                               │
     │                               │                               │
     │ 6. offer (SDP)                │                               │
     │──────────────────────────────>│ 7. relay offer                │
     │                               │──────────────────────────────>│
     │                               │                               │
     │                               │      8. setRemoteDescription()│
     │                               │      9. createAnswer()        │
     │                               │     10. setLocalDescription() │
     │                               │                               │
     │                               │ 11. answer (SDP)              │
     │                               │<──────────────────────────────│
     │ 12. relay answer              │                               │
     │<──────────────────────────────│                               │
     │                               │                               │
     │ 13. setRemoteDescription()    │                               │
     │                               │                               │
     │ 14. ICE candidates            │                               │
     │<─────────────────────────────>│<─────────────────────────────>│
     │                               │                               │
     │ ═══════════════ P2P Media Stream Established ═══════════════ │
     │                               │                               │
```

---

## Feature Breakdown

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Project Setup
- [ ] Initialize monorepo structure (Turborepo or Nx)
- [ ] Setup NestJS backend with TypeScript
- [ ] Setup React frontend with Vite + TypeScript
- [ ] Configure ESLint, Prettier, Husky
- [ ] Setup Docker Compose for local development
- [ ] Configure PostgreSQL database

#### 1.2 Authentication System
- [ ] User registration with email/password
- [ ] JWT-based authentication
- [ ] Protected routes (frontend)
- [ ] Auth guards (backend)
- [ ] Guest access for meetings (optional join without account)

#### 1.3 Database Schema
```prisma
// schema.prisma

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  displayName   String
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  hostedRooms   Room[]    @relation("host")
  participants  Participant[]
  messages      Message[]
}

model Room {
  id            String    @id @default(uuid())
  code          String    @unique  // 9-digit meeting code
  name          String?
  hostId        String
  host          User      @relation("host", fields: [hostId], references: [id])
  isActive      Boolean   @default(true)
  isLocked      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  scheduledAt   DateTime?
  endedAt       DateTime?
  
  participants  Participant[]
  messages      Message[]
  settings      RoomSettings?
}

model RoomSettings {
  id                    String   @id @default(uuid())
  roomId                String   @unique
  room                  Room     @relation(fields: [roomId], references: [id])
  allowScreenShare      Boolean  @default(true)
  allowChat             Boolean  @default(true)
  allowParticipantVideo Boolean  @default(true)
  allowParticipantAudio Boolean  @default(true)
  waitingRoom           Boolean  @default(false)
  maxParticipants       Int      @default(50)
}

model Participant {
  id            String    @id @default(uuid())
  roomId        String
  room          Room      @relation(fields: [roomId], references: [id])
  userId        String?
  user          User?     @relation(fields: [userId], references: [id])
  guestName     String?
  joinedAt      DateTime  @default(now())
  leftAt        DateTime?
  isHost        Boolean   @default(false)
  isMuted       Boolean   @default(false)
  isVideoOff    Boolean   @default(false)
}

model Message {
  id            String    @id @default(uuid())
  roomId        String
  room          Room      @relation(fields: [roomId], references: [id])
  userId        String?
  user          User?     @relation(fields: [userId], references: [id])
  senderName    String
  content       String
  type          MessageType @default(TEXT)
  createdAt     DateTime  @default(now())
}

enum MessageType {
  TEXT
  FILE
  SYSTEM
}
```

---

### Phase 2: WebRTC Implementation (Week 2-3)

#### 2.1 Signaling Server (NestJS WebSocket Gateway)
- [ ] Room management (create, join, leave)
- [ ] SDP offer/answer exchange
- [ ] ICE candidate relay
- [ ] Participant presence tracking
- [ ] Connection state management

#### 2.2 WebRTC Client Manager
- [ ] RTCPeerConnection factory
- [ ] Media stream acquisition (camera/microphone)
- [ ] Peer connection lifecycle management
- [ ] ICE server configuration (STUN/TURN)
- [ ] Connection quality monitoring

#### 2.3 Media Handling
- [ ] Video/audio track management
- [ ] Mute/unmute functionality
- [ ] Camera on/off toggle
- [ ] Device selection (camera, microphone, speaker)
- [ ] Audio level detection for active speaker

---

### Phase 3: Video UI (Week 3-4)

#### 3.1 Meeting Room Layout
- [ ] Grid view (all participants)
- [ ] Speaker view (active speaker large, others small)
- [ ] Sidebar view (presenter + participants)
- [ ] Responsive design for mobile/tablet/desktop
- [ ] Full-screen mode

#### 3.2 Video Components
```
src/
├── components/
│   ├── VideoGrid/
│   │   ├── VideoGrid.tsx         # Main grid container
│   │   ├── VideoTile.tsx         # Individual participant video
│   │   ├── VideoControls.tsx     # Overlay controls
│   │   └── ActiveSpeaker.tsx     # Speaker indicator
│   ├── Controls/
│   │   ├── ControlBar.tsx        # Bottom control bar
│   │   ├── MicButton.tsx
│   │   ├── CameraButton.tsx
│   │   ├── ScreenShareButton.tsx
│   │   ├── ChatButton.tsx
│   │   ├── ParticipantsButton.tsx
│   │   ├── SettingsButton.tsx
│   │   └── LeaveButton.tsx
│   ├── Panels/
│   │   ├── ChatPanel.tsx
│   │   ├── ParticipantsPanel.tsx
│   │   └── SettingsPanel.tsx
│   └── PreJoin/
│       ├── PreJoinScreen.tsx     # Camera/mic preview
│       ├── DeviceSelector.tsx
│       └── JoinForm.tsx
```

#### 3.3 Control Features
- [ ] Mute/unmute microphone
- [ ] Turn camera on/off
- [ ] Virtual background (stretch goal)
- [ ] Noise suppression toggle
- [ ] Picture-in-picture mode

---

### Phase 4: Screen Sharing (Week 4-5)

#### 4.1 Screen Capture
- [ ] `getDisplayMedia()` implementation
- [ ] Share entire screen
- [ ] Share specific window
- [ ] Share browser tab (with audio)
- [ ] Stop sharing functionality

#### 4.2 Screen Share UI
- [ ] Presenter view mode
- [ ] Screen share preview for sharer
- [ ] "You are presenting" indicator
- [ ] Screen share toolbar (pause, stop, annotate)

#### 4.3 Multi-stream Handling
- [ ] Separate video and screen share tracks
- [ ] Replace vs add track strategies
- [ ] Bandwidth optimization for screen content

---

### Phase 5: Chat System (Week 5-6)

#### 5.1 Real-time Chat
- [ ] Text messaging via Socket.io
- [ ] Message persistence (save to database)
- [ ] Chat history on rejoin
- [ ] Typing indicators
- [ ] Read receipts (optional)

#### 5.2 Chat Features
- [ ] Emoji reactions
- [ ] File sharing (images, documents)
- [ ] Reply to messages
- [ ] Private messages (participant to participant)
- [ ] System messages (user joined, user left)

#### 5.3 Chat UI
```tsx
// ChatPanel component structure
<ChatPanel>
  <ChatHeader>
    <Title>In-call messages</Title>
    <CloseButton />
  </ChatHeader>
  <MessageList>
    {messages.map(msg => (
      <ChatMessage
        key={msg.id}
        sender={msg.senderName}
        content={msg.content}
        timestamp={msg.createdAt}
        isOwn={msg.userId === currentUser.id}
      />
    ))}
  </MessageList>
  <TypingIndicator users={typingUsers} />
  <ChatInput
    onSend={handleSendMessage}
    onTyping={handleTyping}
  />
</ChatPanel>
```

---

### Phase 6: Advanced Features (Week 6-8)

#### 6.1 Room Management
- [ ] Waiting room / lobby
- [ ] Host controls (mute all, remove participant)
- [ ] Lock/unlock meeting
- [ ] Meeting recording (MCU required - future)
- [ ] Breakout rooms (stretch goal)

#### 6.2 Quality Features
- [ ] Adaptive bitrate based on bandwidth
- [ ] Network quality indicator
- [ ] Auto-reconnection on disconnect
- [ ] Simulcast for better quality distribution
- [ ] Stats display for debugging

#### 6.3 Accessibility
- [ ] Keyboard shortcuts
- [ ] Screen reader support
- [ ] Closed captions (stretch goal)
- [ ] High contrast mode
- [ ] Focus management

---

## Directory Structure

```
neuron-meet/
├── apps/
│   ├── web/                          # React Frontend
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   │   ├── common/           # Shared UI components
│   │   │   │   ├── meeting/          # Meeting room components
│   │   │   │   ├── chat/             # Chat components
│   │   │   │   └── layout/           # Layout components
│   │   │   ├── hooks/
│   │   │   │   ├── useWebRTC.ts
│   │   │   │   ├── useMediaDevices.ts
│   │   │   │   ├── useSocket.ts
│   │   │   │   ├── useChat.ts
│   │   │   │   └── useRoom.ts
│   │   │   ├── lib/
│   │   │   │   ├── webrtc/
│   │   │   │   │   ├── PeerConnection.ts
│   │   │   │   │   ├── MediaManager.ts
│   │   │   │   │   ├── SignalingClient.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── socket/
│   │   │   │   │   ├── SocketClient.ts
│   │   │   │   │   └── events.ts
│   │   │   │   └── api/
│   │   │   │       └── client.ts
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── PreJoin.tsx
│   │   │   │   └── Meeting.tsx
│   │   │   ├── store/
│   │   │   │   ├── useAuthStore.ts
│   │   │   │   ├── useMeetingStore.ts
│   │   │   │   └── useChatStore.ts
│   │   │   ├── styles/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── server/                       # NestJS Backend
│       ├── src/
│       │   ├── auth/
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.module.ts
│       │   │   ├── jwt.strategy.ts
│       │   │   ├── guards/
│       │   │   └── dto/
│       │   ├── users/
│       │   │   ├── users.controller.ts
│       │   │   ├── users.service.ts
│       │   │   ├── users.module.ts
│       │   │   └── dto/
│       │   ├── rooms/
│       │   │   ├── rooms.controller.ts
│       │   │   ├── rooms.service.ts
│       │   │   ├── rooms.module.ts
│       │   │   ├── rooms.gateway.ts      # Socket.io gateway
│       │   │   └── dto/
│       │   ├── chat/
│       │   │   ├── chat.service.ts
│       │   │   ├── chat.module.ts
│       │   │   └── chat.gateway.ts
│       │   ├── signaling/
│       │   │   ├── signaling.gateway.ts  # WebRTC signaling
│       │   │   ├── signaling.service.ts
│       │   │   └── signaling.module.ts
│       │   ├── prisma/
│       │   │   ├── prisma.service.ts
│       │   │   └── prisma.module.ts
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── interceptors/
│       │   │   └── pipes/
│       │   ├── config/
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── test/
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared types & utilities
│       ├── src/
│       │   ├── types/
│       │   │   ├── room.ts
│       │   │   ├── user.ts
│       │   │   ├── message.ts
│       │   │   └── socket-events.ts
│       │   └── utils/
│       ├── tsconfig.json
│       └── package.json
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.server
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── turbo.json
├── package.json
├── .env.example
└── README.md
```

---

## Socket.io Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ roomId, userId?, guestName? }` | Join a meeting room |
| `leave-room` | `{ roomId }` | Leave the room |
| `offer` | `{ targetId, sdp }` | Send WebRTC offer |
| `answer` | `{ targetId, sdp }` | Send WebRTC answer |
| `ice-candidate` | `{ targetId, candidate }` | Send ICE candidate |
| `toggle-audio` | `{ roomId, enabled }` | Mute/unmute audio |
| `toggle-video` | `{ roomId, enabled }` | Turn camera on/off |
| `start-screen-share` | `{ roomId }` | Start screen sharing |
| `stop-screen-share` | `{ roomId }` | Stop screen sharing |
| `chat-message` | `{ roomId, content }` | Send chat message |
| `typing-start` | `{ roomId }` | User started typing |
| `typing-stop` | `{ roomId }` | User stopped typing |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room-joined` | `{ roomId, participants[], messages[] }` | Successfully joined |
| `user-joined` | `{ participant }` | New user joined room |
| `user-left` | `{ participantId }` | User left room |
| `offer` | `{ senderId, sdp }` | Receive WebRTC offer |
| `answer` | `{ senderId, sdp }` | Receive WebRTC answer |
| `ice-candidate` | `{ senderId, candidate }` | Receive ICE candidate |
| `user-toggle-audio` | `{ participantId, enabled }` | User mute state changed |
| `user-toggle-video` | `{ participantId, enabled }` | User camera state changed |
| `screen-share-started` | `{ participantId }` | User started screen share |
| `screen-share-stopped` | `{ participantId }` | User stopped screen share |
| `chat-message` | `{ message }` | New chat message |
| `user-typing` | `{ participantId, isTyping }` | Typing indicator |
| `error` | `{ code, message }` | Error occurred |

---

## API Endpoints

### Authentication
```
POST   /api/auth/register         - Register new user
POST   /api/auth/login            - Login user
POST   /api/auth/logout           - Logout user
POST   /api/auth/refresh          - Refresh access token
GET    /api/auth/me               - Get current user
```

### Users
```
GET    /api/users/:id             - Get user by ID
PATCH  /api/users/:id             - Update user profile
DELETE /api/users/:id             - Delete user account
```

### Rooms
```
POST   /api/rooms                 - Create new room
GET    /api/rooms/:id             - Get room details
GET    /api/rooms/code/:code      - Get room by meeting code
PATCH  /api/rooms/:id             - Update room settings
DELETE /api/rooms/:id             - Delete room
GET    /api/rooms/:id/participants - Get room participants
POST   /api/rooms/:id/join        - Join room (get token)
```

### Chat
```
GET    /api/rooms/:id/messages    - Get chat history
```

---

## Key Implementation Details

### 1. WebRTC Peer Connection Manager

```typescript
// lib/webrtc/PeerConnection.ts
export class PeerConnectionManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add TURN server for production
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
  ];

  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    
    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(peerId, event.candidate);
      }
    };
    
    // Handle remote tracks
    pc.ontrack = (event) => {
      this.onRemoteStream?.(peerId, event.streams[0]);
    };
    
    // Monitor connection state
    pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(peerId, pc.connectionState);
    };
    
    this.peerConnections.set(peerId, pc);
    return pc;
  }

  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) throw new Error('Peer connection not found');
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(
    peerId: string, 
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    let pc = this.peerConnections.get(peerId);
    if (!pc) {
      pc = await this.createPeerConnection(peerId);
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) throw new Error('Peer connection not found');
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // Callbacks
  onIceCandidate?: (peerId: string, candidate: RTCIceCandidate) => void;
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;
}
```

### 2. NestJS Signaling Gateway

```typescript
// signaling/signaling.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/signaling'
})
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();
  private socketToUser: Map<string, { oderId: string; roomId: string }>> = new Map();

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const userData = this.socketToUser.get(client.id);
    if (userData) {
      this.handleLeaveRoom(client, { roomId: userData.roomId });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string }
  ) {
    const { roomId, userId } = data;
    
    // Join socket room
    client.join(roomId);
    
    // Track user
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(client.id visudo);
    this.socketToUser.set(client.id, { oderId: userId, roomId });
    
    // Notify others in room
    client.to(roomId).emit('user-joined', { 
      oderId: client.id,
      userId
    });
    
    // Send list of existing participants
    const participants = Array.from(this.rooms.get(roomId) || [])
      .filter(id => id !== client.id);
    
    return { participants };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    const { roomId } = data;
    
    client.leave(roomId);
    this.rooms.get(roomId)?.delete(client.id);
    this.socketToUser.delete(client.id);
    
    client.to(roomId).emit('user-left', { oderId: client.id });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetId: string; sdp: RTCSessionDescriptionInit }
  ) {
    this.server.to(data.targetId).emit('offer', {
      senderId: client.id,
      sdp: data.sdp
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetId: string; sdp: RTCSessionDescriptionInit }
  ) {
    this.server.to(data.targetId).emit('answer', {
      senderId: client.id,
      sdp: data.sdp
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetId: string; candidate: RTCIceCandidateInit }
  ) {
    this.server.to(data.targetId).emit('ice-candidate', {
      senderId: client.id,
      candidate: data.candidate
    });
  }
}
```

### 3. Screen Sharing Implementation

```typescript
// lib/webrtc/ScreenShare.ts
export async function startScreenShare(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });
    
    // Handle when user stops sharing via browser UI
    stream.getVideoTracks()[0].onended = () => {
      // Trigger stop screen share event
      window.dispatchEvent(new CustomEvent('screenshare-ended'));
    };
    
    return stream;
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Screen sharing permission denied');
    }
    throw error;
  }
}

export function replaceVideoTrack(
  peerConnection: RTCPeerConnection,
  newTrack: MediaStreamTrack
) {
  const sender = peerConnection.getSenders().find(
    s => s.track?.kind === 'video'
  );
  
  if (sender) {
    sender.replaceTrack(newTrack);
  }
}
```

---

## Environment Variables

```env
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/neuronmeet"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001

# TURN Server (production)
TURN_SERVER_URL=turn:your-turn-server.com:3478
TURN_USERNAME=username
TURN_PASSWORD=password
```

---

## Development Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1-2 | Infrastructure | Project setup, auth, database, basic UI |
| 2-3 | WebRTC Core | Signaling server, P2P connections, media streams |
| 3-4 | Video UI | Video grid, controls, device selection |
| 4-5 | Screen Sharing | Display capture, presenter view, multi-stream |
| 5-6 | Chat System | Real-time messaging, persistence, UI |
| 6-7 | Polish | Error handling, reconnection, quality optimization |
| 7-8 | Advanced | Host controls, waiting room, accessibility |

---

## Testing Strategy

### Unit Tests
- WebRTC utility functions
- Socket event handlers
- State management stores
- API endpoint logic

### Integration Tests
- Authentication flow
- Room creation and joining
- Socket event round-trips

### E2E Tests (Playwright)
- Complete meeting flow
- Multi-participant scenarios
- Screen sharing workflow
- Chat functionality

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   CloudFlare    │
                    │   (CDN + DNS)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐      ┌───────────▼───────────┐
    │   Vercel/Netlify  │      │    Railway/Render      │
    │   (React App)     │      │    (NestJS API)        │
    └───────────────────┘      └───────────┬───────────┘
                                           │
                               ┌───────────▼───────────┐
                               │   PostgreSQL (Neon)    │
                               └───────────────────────┘
                               
                               ┌───────────────────────┐
                               │   TURN Server          │
                               │   (Coturn/Twilio)      │
                               └───────────────────────┘
```

---

## Security Considerations

1. **Authentication**: JWT with secure httpOnly cookies
2. **Room Access**: Room code + optional password protection
3. **CORS**: Strict origin validation in production
4. **Rate Limiting**: Prevent abuse on signaling endpoints
5. **Input Validation**: Sanitize all user inputs
6. **HTTPS**: Mandatory for WebRTC (getUserMedia requirements)
7. **TURN Credentials**: Time-limited TURN credentials

---

## Next Steps

1. **Initialize the project** - Set up monorepo structure
2. **Create NestJS backend** - Auth, rooms, and signaling
3. **Build React frontend** - UI components and WebRTC logic
4. **Implement WebRTC** - P2P connections and media handling
5. **Add screen sharing** - Display capture functionality
6. **Build chat system** - Real-time messaging
7. **Deploy MVP** - Get it running in production

---

Ready to start building? Let me know which phase you'd like to begin with!
