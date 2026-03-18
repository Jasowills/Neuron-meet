import { Controller, Get, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RoomsModule } from "./rooms/rooms.module";
import { SignalingModule } from "./signaling/signaling.module";
import { ChatModule } from "./chat/chat.module";

@Controller()
class AppController {
  @Get()
  getRoot() {
    return "server running";
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    SignalingModule,
    ChatModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
