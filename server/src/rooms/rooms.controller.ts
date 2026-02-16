import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomSettingsDto } from './dto/rooms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createRoom(@Request() req: any, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(req.user.id, dto);
  }

  @Get('code/:code')
  async getRoomByCode(@Param('code') code: string) {
    const room = await this.roomsService.findByCode(code);
    // Return limited info for non-authenticated requests
    return {
      id: room.id,
      code: room.code,
      name: room.name,
      isActive: room.isActive,
      isLocked: room.isLocked,
      host: room.host,
      settings: room.settings ? {
        waitingRoom: room.settings.waitingRoom,
      } : null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getRoom(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateRoomSettingsDto,
  ) {
    return this.roomsService.updateSettings(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async endRoom(@Param('id') id: string, @Request() req: any) {
    return this.roomsService.endRoom(id, req.user.id);
  }

  @Get(':id/participants')
  async getParticipants(@Param('id') id: string) {
    return this.roomsService.getActiveParticipants(id);
  }

  @Get('code/:code/participants')
  async getParticipantsByCode(@Param('code') code: string) {
    return this.roomsService.getActiveParticipantsByCode(code);
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    return this.roomsService.getRoomMessages(id);
  }
}
