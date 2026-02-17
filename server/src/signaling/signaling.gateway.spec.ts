import { SignalingGateway } from "./signaling.gateway";

describe("SignalingGateway", () => {
  it("cleans prior socket state before handling a new join on same socket", async () => {
    const signalingService = {
      getUserData: jest.fn().mockReturnValue({
        roomId: "old-room",
        userId: "user-1",
      }),
      removeUser: jest.fn(),
      joinRoom: jest.fn().mockResolvedValue({
        roomId: "new-room",
        isHost: false,
        messages: [],
        settings: null,
      }),
      getRoomParticipants: jest.fn().mockReturnValue([]),
    } as any;

    const gateway = new SignalingGateway(signalingService);

    const client = {
      id: "socket-1",
      leave: jest.fn(),
      join: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    } as any;

    await gateway.handleJoinRoom(client, {
      roomCode: "ABC123",
      userId: "user-1",
      displayName: "Jason",
    });

    expect(client.leave).toHaveBeenCalledWith("old-room");
    expect(signalingService.removeUser).toHaveBeenCalledWith("socket-1");
    expect(client.join).toHaveBeenCalledWith("new-room");
  });

  it("emits join-error when joinRoom throws", async () => {
    const signalingService = {
      getUserData: jest.fn().mockReturnValue(undefined),
      removeUser: jest.fn(),
      joinRoom: jest.fn().mockRejectedValue(new Error("Room not found")),
      getRoomParticipants: jest.fn(),
    } as any;

    const gateway = new SignalingGateway(signalingService);

    const client = {
      id: "socket-1",
      leave: jest.fn(),
      join: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    } as any;

    const result = await gateway.handleJoinRoom(client, {
      roomCode: "ABC123",
      userId: "user-1",
      displayName: "Jason",
    });

    expect(client.emit).toHaveBeenCalledWith("join-error", {
      code: "JOIN_FAILED",
      message: "Room not found",
    });
    expect(result).toEqual({ success: false, error: "Room not found" });
  });

  it("broadcasts user-left and removes user on disconnect", async () => {
    const signalingService = {
      getUserData: jest.fn().mockReturnValue({
        roomId: "room-1",
        userId: "user-1",
      }),
      removeUser: jest.fn(),
      joinRoom: jest.fn(),
      getRoomParticipants: jest.fn(),
    } as any;

    const gateway = new SignalingGateway(signalingService);
    const roomEmitter = { emit: jest.fn() };

    const client = {
      id: "socket-1",
      to: jest.fn().mockReturnValue(roomEmitter),
    } as any;

    await gateway.handleDisconnect(client);

    expect(client.to).toHaveBeenCalledWith("room-1");
    expect(roomEmitter.emit).toHaveBeenCalledWith("user-left", {
      socketId: "socket-1",
      userId: "user-1",
    });
    expect(signalingService.removeUser).toHaveBeenCalledWith("socket-1");
  });
});
