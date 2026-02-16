import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface UserData {
  socketId: string;
  userId?: string;
  displayName: string;
  roomId: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

interface RoomJoinResult {
  roomId: string;
  isHost: boolean;
  messages: any[];
  settings: any;
}

@Injectable()
export class SignalingService {
  // In-memory storage for active connections
  private users: Map<string, UserData> = new Map();
  private rooms: Map<string, Set<string>> = new Map();

  constructor(private prisma: PrismaService) {}

  async joinRoom(
    socketId: string,
    roomCode: string,
    userId?: string,
    displayName: string = "Guest",
  ): Promise<RoomJoinResult> {
    // Verify room exists and is active
    const room = await this.prisma.room.findUnique({
      where: { code: roomCode },
      include: {
        settings: true,
      },
    });

    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.isActive) {
      throw new Error("Room is no longer active");
    }

    if (room.isLocked) {
      throw new Error("Room is locked");
    }

    // Check max participants
    const currentCount = this.rooms.get(room.id)?.size || 0;
    if (room.settings && currentCount >= room.settings.maxParticipants) {
      throw new Error("Room is full");
    }

    const isHost = room.hostId === userId;

    // Clean up any existing socket for the same user in this room (prevents duplicates)
    if (userId) {
      const existingSocketIds = this.rooms.get(room.id);
      if (existingSocketIds) {
        const socketsToRemove: string[] = [];
        for (const existingSocketId of existingSocketIds) {
          const existingUser = this.users.get(existingSocketId);
          if (
            existingUser &&
            existingUser.userId === userId &&
            existingSocketId !== socketId
          ) {
            socketsToRemove.push(existingSocketId);
          }
        }
        // Remove old socket entries for this user
        socketsToRemove.forEach((id) => {
          this.users.delete(id);
          existingSocketIds.delete(id);
        });
      }
    }

    // Store user data
    const userData: UserData = {
      socketId,
      userId,
      displayName,
      roomId: room.id,
      isHost,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
    };
    this.users.set(socketId, userData);

    // Add to room
    if (!this.rooms.has(room.id)) {
      this.rooms.set(room.id, new Set());
    }
    this.rooms.get(room.id)!.add(socketId);

    // Add participant to database
    await this.prisma.participant.create({
      data: {
        roomId: room.id,
        userId: userId,
        guestName: userId ? null : displayName,
        isHost,
      },
    });

    // Get recent messages
    const messages = await this.prisma.message.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    return {
      roomId: room.id,
      isHost,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.userId,
        senderName: m.senderName,
        content: m.content,
        type: m.type,
        timestamp: m.createdAt.toISOString(),
      })),
      settings: room.settings
        ? {
            allowScreenShare: room.settings.allowScreenShare,
            allowChat: room.settings.allowChat,
            waitingRoom: room.settings.waitingRoom,
          }
        : null,
    };
  }

  getUserData(socketId: string): UserData | undefined {
    return this.users.get(socketId);
  }

  removeUser(socketId: string): void {
    const userData = this.users.get(socketId);
    if (userData) {
      this.rooms.get(userData.roomId)?.delete(socketId);
      this.users.delete(socketId);
    }
  }

  getRoomParticipants(roomId: string): UserData[] {
    const socketIds = this.rooms.get(roomId);
    if (!socketIds) return [];

    return Array.from(socketIds)
      .map((id) => this.users.get(id))
      .filter((u): u is UserData => u !== undefined);
  }

  updateUserMedia(
    socketId: string,
    updates: Partial<
      Pick<UserData, "isMuted" | "isVideoOff" | "isScreenSharing">
    >,
  ): void {
    const userData = this.users.get(socketId);
    if (userData) {
      Object.assign(userData, updates);
    }
  }

  async lockRoom(roomId: string, locked: boolean): Promise<void> {
    await this.prisma.room.update({
      where: { id: roomId },
      data: { isLocked: locked },
    });
  }

  getRoomCount(roomId: string): number {
    return this.rooms.get(roomId)?.size || 0;
  }
}
