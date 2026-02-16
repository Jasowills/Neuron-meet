import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SignalingService } from './signaling.service';

interface JoinRoomPayload {
  roomCode: string;
  userId?: string;
  displayName: string;
}

interface SignalPayload {
  targetId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

interface MediaTogglePayload {
  roomId: string;
  enabled: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private signalingService: SignalingService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const userData = this.signalingService.getUserData(client.id);
    
    if (userData) {
      // Notify others in room
      client.to(userData.roomId).emit('user-left', {
        socketId: client.id,
        userId: userData.userId,
      });
      
      // Clean up
      this.signalingService.removeUser(client.id);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomPayload,
  ) {
    const { roomCode, userId, displayName } = data;
    console.log('Join room request:', { roomCode, userId, displayName, socketId: client.id });

    try {
      // Validate room exists and get room data
      const roomData = await this.signalingService.joinRoom(
        client.id,
        roomCode,
        userId,
        displayName,
      );
      
      console.log('Room data:', roomData);

      // Join socket room
      client.join(roomData.roomId);

      // Get existing participants in room
      const participants = this.signalingService.getRoomParticipants(roomData.roomId);

      // Notify others that a new user joined
      client.to(roomData.roomId).emit('user-joined', {
        participant: {
          socketId: client.id,
          userId,
          displayName,
          isHost: roomData.isHost,
          isMuted: false,
          isVideoOff: false,
          isScreenSharing: false,
        },
      });

      // Emit room-joined event to the joining client
      client.emit('room-joined', {
        roomId: roomData.roomId,
        roomCode,
        isHost: roomData.isHost,
        participants: participants.filter(p => p.socketId !== client.id),
        messages: roomData.messages,
        settings: roomData.settings,
      });

      return {
        success: true,
        roomId: roomData.roomId,
        roomCode,
        isHost: roomData.isHost,
        participants: participants.filter(p => p.socketId !== client.id),
        messages: roomData.messages,
        settings: roomData.settings,
      };
    } catch (error) {
      console.error('Join room error:', error.message);
      client.emit('error', {
        code: 'JOIN_FAILED',
        message: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userData = this.signalingService.getUserData(client.id);

    if (userData) {
      client.leave(roomId);
      client.to(roomId).emit('user-left', {
        socketId: client.id,
        userId: userData.userId,
      });
      this.signalingService.removeUser(client.id);
    }

    return { success: true };
  }

  // WebRTC Signaling
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalPayload,
  ) {
    const userData = this.signalingService.getUserData(client.id);
    
    this.server.to(data.targetId).emit('offer', {
      senderId: client.id,
      userId: userData?.userId,
      displayName: userData?.displayName,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalPayload,
  ) {
    this.server.to(data.targetId).emit('answer', {
      senderId: client.id,
      sdp: data.sdp,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalPayload,
  ) {
    this.server.to(data.targetId).emit('ice-candidate', {
      senderId: client.id,
      candidate: data.candidate,
    });
  }

  // Media controls
  @SubscribeMessage('toggle-audio')
  handleToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaTogglePayload,
  ) {
    this.signalingService.updateUserMedia(client.id, { isMuted: !data.enabled });
    
    client.to(data.roomId).emit('user-toggle-audio', {
      socketId: client.id,
      enabled: data.enabled,
    });
  }

  @SubscribeMessage('toggle-video')
  handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MediaTogglePayload,
  ) {
    this.signalingService.updateUserMedia(client.id, { isVideoOff: !data.enabled });
    
    client.to(data.roomId).emit('user-toggle-video', {
      socketId: client.id,
      enabled: data.enabled,
    });
  }

  @SubscribeMessage('start-screen-share')
  handleStartScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    this.signalingService.updateUserMedia(client.id, { isScreenSharing: true });
    
    client.to(data.roomId).emit('screen-share-started', {
      socketId: client.id,
    });
  }

  @SubscribeMessage('stop-screen-share')
  handleStopScreenShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    this.signalingService.updateUserMedia(client.id, { isScreenSharing: false });
    
    client.to(data.roomId).emit('screen-share-stopped', {
      socketId: client.id,
    });
  }

  // Hand raise
  @SubscribeMessage('toggle-hand-raise')
  handleToggleHandRaise(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; raised: boolean },
  ) {
    const userData = this.signalingService.getUserData(client.id);
    
    if (data.raised) {
      client.to(data.roomId).emit('user-hand-raised', {
        socketId: client.id,
        displayName: userData?.displayName || 'Participant',
      });
    } else {
      client.to(data.roomId).emit('user-hand-lowered', {
        socketId: client.id,
      });
    }
  }

  // Host controls
  @SubscribeMessage('mute-participant')
  async handleMuteParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetId: string },
  ) {
    const userData = this.signalingService.getUserData(client.id);
    
    if (!userData?.isHost) {
      return { success: false, error: 'Not authorized' };
    }

    this.server.to(data.targetId).emit('force-mute', {});
    this.server.to(data.roomId).emit('user-toggle-audio', {
      socketId: data.targetId,
      enabled: false,
    });

    return { success: true };
  }

  @SubscribeMessage('remove-participant')
  async handleRemoveParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetId: string },
  ) {
    const userData = this.signalingService.getUserData(client.id);
    
    if (!userData?.isHost) {
      return { success: false, error: 'Not authorized' };
    }

    this.server.to(data.targetId).emit('force-disconnect', {
      reason: 'Removed by host',
    });

    return { success: true };
  }

  @SubscribeMessage('lock-room')
  async handleLockRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; locked: boolean },
  ) {
    const userData = this.signalingService.getUserData(client.id);
    
    if (!userData?.isHost) {
      return { success: false, error: 'Not authorized' };
    }

    await this.signalingService.lockRoom(data.roomId, data.locked);
    
    client.to(data.roomId).emit('room-locked', {
      locked: data.locked,
    });

    return { success: true };
  }
}
