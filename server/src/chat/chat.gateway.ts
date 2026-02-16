import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

interface ChatMessagePayload {
  roomId: string;
  content: string;
}

interface TypingPayload {
  roomId: string;
}

// In-memory typing state
const typingUsers: Map<string, Map<string, NodeJS.Timeout>> = new Map();

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('chat-message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessagePayload,
  ) {
    const { roomId, content } = data;

    // Get user info from handshake or stored data
    const userId = client.handshake.auth?.userId;
    const displayName = client.handshake.auth?.displayName || 'Guest';

    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Message content is required' };
    }

    try {
      // Save message to database
      const message = await this.chatService.createMessage({
        roomId,
        userId,
        senderName: displayName,
        content: content.trim(),
      });

      // Broadcast to all in room (including sender)
      // Include socketId so clients can identify their own messages
      this.server.to(roomId).emit('chat-message', {
        ...message,
        senderId: client.id, // Use socket ID for real-time identification
      });

      // Clear typing indicator
      this.clearTyping(roomId, client.id);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ) {
    const { roomId } = data;
    const displayName = client.handshake.auth?.displayName || 'Guest';

    // Set up typing timeout (clear after 3 seconds)
    this.setTyping(roomId, client.id);

    // Broadcast typing indicator
    client.to(roomId).emit('user-typing', {
      socketId: client.id,
      displayName,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingPayload,
  ) {
    const { roomId } = data;
    const displayName = client.handshake.auth?.displayName || 'Guest';

    this.clearTyping(roomId, client.id);

    client.to(roomId).emit('user-typing', {
      socketId: client.id,
      displayName,
      isTyping: false,
    });
  }

  private setTyping(roomId: string, socketId: string) {
    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Map());
    }

    const roomTyping = typingUsers.get(roomId)!;

    // Clear existing timeout
    const existing = roomTyping.get(socketId);
    if (existing) {
      clearTimeout(existing);
    }

    // Set new timeout to auto-clear typing
    const timeout = setTimeout(() => {
      this.clearTyping(roomId, socketId);
    }, 3000);

    roomTyping.set(socketId, timeout);
  }

  private clearTyping(roomId: string, socketId: string) {
    const roomTyping = typingUsers.get(roomId);
    if (roomTyping) {
      const timeout = roomTyping.get(socketId);
      if (timeout) {
        clearTimeout(timeout);
        roomTyping.delete(socketId);
      }
    }
  }
}
