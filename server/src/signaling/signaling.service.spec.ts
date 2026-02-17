import { SignalingService } from "./signaling.service";

const makeRoom = (overrides?: Partial<any>) => ({
  id: "room-1",
  code: "ABC123",
  isActive: true,
  isLocked: false,
  hostId: "host-1",
  settings: {
    maxParticipants: 10,
    allowScreenShare: true,
    allowChat: true,
    waitingRoom: false,
  },
  ...overrides,
});

describe("SignalingService", () => {
  const prismaMock = {
    room: { findUnique: jest.fn() },
    participant: { create: jest.fn() },
    message: { findMany: jest.fn() },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.room.findUnique.mockResolvedValue(makeRoom());
    prismaMock.participant.create.mockResolvedValue({});
    prismaMock.message.findMany.mockResolvedValue([]);
  });

  it("removes stale socket for same user on rejoin", async () => {
    const service = new SignalingService(prismaMock);

    await service.joinRoom("socket-1", "ABC123", "user-1", "Jason");
    await service.joinRoom("socket-2", "ABC123", "user-1", "Jason");

    expect(service.getRoomCount("room-1")).toBe(1);
    expect(service.getRoomParticipants("room-1").map((p) => p.socketId)).toEqual(
      ["socket-2"],
    );
  });

  it("cleans up empty room set when user leaves", async () => {
    const service = new SignalingService(prismaMock);

    await service.joinRoom("socket-1", "ABC123", "user-1", "Jason");
    service.removeUser("socket-1");

    expect(service.getRoomCount("room-1")).toBe(0);
    expect(service.getRoomParticipants("room-1")).toEqual([]);
  });

  it("drops orphaned sockets before max-participant validation", async () => {
    const service = new SignalingService(prismaMock);
    prismaMock.room.findUnique.mockResolvedValue(
      makeRoom({
        settings: {
          maxParticipants: 1,
          allowScreenShare: true,
          allowChat: true,
          waitingRoom: false,
        },
      }),
    );

    const internal = service as any;
    internal.rooms.set("room-1", new Set(["orphan-socket"]));

    await expect(
      service.joinRoom("socket-1", "ABC123", "user-1", "Jason"),
    ).resolves.toMatchObject({ roomId: "room-1" });
    expect(service.getRoomCount("room-1")).toBe(1);
  });
});
