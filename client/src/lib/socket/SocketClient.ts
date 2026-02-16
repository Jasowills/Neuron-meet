import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useMeetingStore } from "@/store/useMeetingStore";
import { toast } from "@/store/useToastStore";

const WS_URL = import.meta.env.VITE_WS_URL || "";

class SocketClient {
  private socket: Socket | null = null;
  private static instance: SocketClient;

  private constructor() {}

  static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  connect(displayName: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const { user, token } = useAuthStore.getState();

    this.socket = io(WS_URL, {
      auth: {
        token,
        userId: user?.id,
        displayName: user?.displayName || displayName,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      const { isReconnecting, setReconnecting } = useMeetingStore.getState();
      if (isReconnecting) {
        setReconnecting(false);
        toast.success("Reconnected to meeting");
      }
    });

    this.socket.on("disconnect", (reason) => {
      const { isConnected, setReconnecting } = useMeetingStore.getState();
      if (isConnected && reason !== "io client disconnect") {
        setReconnecting(true);
        toast.warning("Connection lost. Reconnecting...");
      }
    });

    this.socket.on("reconnect_attempt", (_attemptNumber) => {
      useMeetingStore.getState().setReconnecting(true);
    });

    this.socket.on("reconnect_failed", () => {
      useMeetingStore.getState().setReconnecting(false);
      toast.error("Failed to reconnect. Please refresh the page.");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }
}

export const socketClient = SocketClient.getInstance();
