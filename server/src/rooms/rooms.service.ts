import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, UpdateRoomSettingsDto } from './dto/rooms.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  // Generate a unique 9-digit room code
  private generateRoomCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 3; i++) {
      if (i > 0) code += '-';
      for (let j = 0; j < 3; j++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return code; // Format: xxx-xxx-xxx
  }

  async createRoom(hostId: string, dto: CreateRoomDto) {
    let code: string;
    let attempts = 0;

    // Ensure unique code
    do {
      code = this.generateRoomCode();
      const existing = await this.prisma.room.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new BadRequestException('Failed to generate unique room code');
    }

    const room = await this.prisma.room.create({
      data: {
        code,
        name: dto.name || 'Meeting Room',
        hostId,
        settings: {
          create: {
            waitingRoom: dto.waitingRoom ?? false,
            maxParticipants: dto.maxParticipants ?? 50,
          },
        },
      },
      include: {
        settings: true,
        host: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return room;
  }

  async findByCode(code: string) {
    const room = await this.prisma.room.findUnique({
      where: { code },
      include: {
        settings: true,
        host: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async findById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        settings: true,
        host: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async updateSettings(roomId: string, userId: string, dto: UpdateRoomSettingsDto) {
    const room = await this.findById(roomId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can update room settings');
    }

    const { isLocked, ...settingsData } = dto;

    // Update room lock status
    if (isLocked !== undefined) {
      await this.prisma.room.update({
        where: { id: roomId },
        data: { isLocked },
      });
    }

    // Update settings
    if (Object.keys(settingsData).length > 0) {
      await this.prisma.roomSettings.update({
        where: { roomId },
        data: settingsData,
      });
    }

    return this.findById(roomId);
  }

  async endRoom(roomId: string, userId: string) {
    const room = await this.findById(roomId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can end the room');
    }

    return this.prisma.room.update({
      where: { id: roomId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
  }

  async addParticipant(roomId: string, userId?: string, guestName?: string) {
    const room = await this.findById(roomId);

    if (!room.isActive) {
      throw new BadRequestException('Room is no longer active');
    }

    if (room.isLocked) {
      throw new ForbiddenException('Room is locked');
    }

    // Check max participants
    const participantCount = await this.prisma.participant.count({
      where: { roomId, leftAt: null },
    });

    if (room.settings && participantCount >= room.settings.maxParticipants) {
      throw new BadRequestException('Room is full');
    }

    return this.prisma.participant.create({
      data: {
        roomId,
        userId,
        guestName,
        isHost: room.hostId === userId,
      },
    });
  }

  async removeParticipant(participantId: string) {
    return this.prisma.participant.update({
      where: { id: participantId },
      data: { leftAt: new Date() },
    });
  }

  async getActiveParticipants(roomId: string) {
    return this.prisma.participant.findMany({
      where: {
        roomId,
        leftAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getRoomMessages(roomId: string, limit = 100) {
    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
