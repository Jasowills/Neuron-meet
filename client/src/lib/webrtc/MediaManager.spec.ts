import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaManager } from "./MediaManager";

describe("MediaManager", () => {
  let manager: MediaManager;

  beforeEach(() => {
    manager = new MediaManager();
  });

  afterEach(() => {
    manager.stopAll();
    vi.restoreAllMocks();
  });

  it("requests screen share without system audio to reduce echo loops", async () => {
    const videoTrack = { onended: null as (() => void) | null };
    const screenStream = {
      getVideoTracks: () => [videoTrack],
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream;

    const getDisplayMedia = vi.fn().mockResolvedValue(screenStream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getDisplayMedia },
    });

    await manager.startScreenShare();

    expect(getDisplayMedia).toHaveBeenCalledWith({
      video: true,
      audio: false,
    });
  });

  it("stops screen tracks when onended fires", async () => {
    const stop = vi.fn();
    const videoTrack = { onended: null as (() => void) | null };
    const screenStream = {
      getVideoTracks: () => [videoTrack],
      getTracks: () => [{ stop }],
    } as unknown as MediaStream;

    const getDisplayMedia = vi.fn().mockResolvedValue(screenStream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getDisplayMedia },
    });

    await manager.startScreenShare();
    expect(typeof videoTrack.onended).toBe("function");

    videoTrack.onended?.();
    expect(stop).toHaveBeenCalled();
    expect(manager.getScreenStreamRef()).toBeNull();
  });
});
