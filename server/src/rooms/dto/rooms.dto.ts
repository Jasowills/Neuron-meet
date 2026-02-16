import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  waitingRoom?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  maxParticipants?: number;
}

export class UpdateRoomSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowScreenShare?: boolean;

  @IsOptional()
  @IsBoolean()
  allowChat?: boolean;

  @IsOptional()
  @IsBoolean()
  allowParticipantVideo?: boolean;

  @IsOptional()
  @IsBoolean()
  allowParticipantAudio?: boolean;

  @IsOptional()
  @IsBoolean()
  waitingRoom?: boolean;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}

export class JoinRoomDto {
  @IsString()
  roomCode: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  guestName?: string;
}
