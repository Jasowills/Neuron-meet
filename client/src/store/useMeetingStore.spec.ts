import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMeetingStore } from "./useMeetingStore";

describe("useMeetingStore", () => {
  beforeEach(() => {
    useMeetingStore.getState().reset();
  });

  it("adds and removes participants without leaking count", () => {
    const store = useMeetingStore.getState();

    store.addParticipant({
      socketId: "peer-1",
      displayName: "Peer 1",
      isHost: false,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isHandRaised: false,
    });
    store.addParticipant({
      socketId: "peer-2",
      displayName: "Peer 2",
      isHost: false,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isHandRaised: false,
    });

    expect(useMeetingStore.getState().participants.size).toBe(2);

    store.removeParticipant("peer-1");
    expect(useMeetingStore.getState().participants.size).toBe(1);
    expect(useMeetingStore.getState().participants.has("peer-1")).toBe(false);
  });

  it("sets explicit muted/video flags deterministically", () => {
    const store = useMeetingStore.getState();

    store.setMuted(true);
    store.setVideoOff(true);
    expect(useMeetingStore.getState().isMuted).toBe(true);
    expect(useMeetingStore.getState().isVideoOff).toBe(true);

    store.setMuted(false);
    store.setVideoOff(false);
    expect(useMeetingStore.getState().isMuted).toBe(false);
    expect(useMeetingStore.getState().isVideoOff).toBe(false);
  });

  it("reset stops local and screen tracks", () => {
    const localTrackStop = vi.fn();
    const screenTrackStop = vi.fn();

    const localStream = {
      getTracks: () => [{ stop: localTrackStop }],
    } as unknown as MediaStream;
    const screenStream = {
      getTracks: () => [{ stop: screenTrackStop }],
    } as unknown as MediaStream;

    useMeetingStore.getState().setLocalStream(localStream);
    useMeetingStore.getState().setScreenStream(screenStream);

    useMeetingStore.getState().reset();

    expect(localTrackStop).toHaveBeenCalledTimes(1);
    expect(screenTrackStop).toHaveBeenCalledTimes(1);
    expect(useMeetingStore.getState().participants.size).toBe(0);
    expect(useMeetingStore.getState().roomId).toBeNull();
  });
});
