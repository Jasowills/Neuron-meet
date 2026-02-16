import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType } from '@prisma/client';

interface CreateMessageDto {
  roomId: string;
  userId?: string;
  senderName: string;
  content: string;
  type?: MessageType;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        roomId: data.roomId,
        userId: data.userId,
        senderName: data.senderName,
        content: data.content,
        type: data.type || MessageType.TEXT,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: message.id,
      senderId: message.userId,
      senderName: message.senderName,
      content: message.content,
      type: message.type,
      timestamp: message.createdAt.toISOString(),
      user: message.user,
    };
  }

  async getMessages(roomId: string, limit = 100, before?: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        ...(before && {
          createdAt: {
            lt: new Date(before),
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return messages.reverse().map(m => ({
      id: m.id,
      senderId: m.userId,
      senderName: m.senderName,
      content: m.content,
      type: m.type,
      timestamp: m.createdAt.toISOString(),
      user: m.user,
    }));
  }

  async createSystemMessage(roomId: string, content: string) {
    return this.createMessage({
      roomId,
      senderName: 'System',
      content,
      type: MessageType.SYSTEM,
    });
  }
}
