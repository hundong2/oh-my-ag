import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";
import { usage } from "../commands/usage.js";
import type { QuotaSnapshot } from "../lib/antigravity-bridge.js";

const mockBridge = vi.hoisted(() => ({
  fetchQuota: vi.fn(),
}));

vi.mock("../lib/antigravity-bridge.js", () => mockBridge);

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  spinner: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
  log: { error: vi.fn() },
}));

describe("usage command", () => {
  let consoleSpy: MockInstance;
  let clearSpy: MockInstance;
  let exitSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    clearSpy = vi.spyOn(console, "clear").mockImplementation(() => {});
    exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(
        (_code?: string | number | null | undefined): never => {
          throw new Error("process.exit");
        },
      );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("interactive mode", () => {
    it("should exit with code 1 when connection fails", async () => {
      mockBridge.fetchQuota.mockResolvedValue(null);

      await expect(usage(false)).rejects.toThrow("process.exit");
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("should render chart when connection succeeds", async () => {
      const snapshot: QuotaSnapshot = {
        userName: "TestUser",
        email: "test@test.com",
        planName: "Pro",
        promptCredits: {
          available: 750,
          monthly: 1000,
          usedPercent: 25,
          remainingPercent: 75,
        },
        models: [
          {
            label: "Gemini Pro",
            modelId: "gemini-pro",
            remainingPercent: 80,
            isExhausted: false,
            resetTime: null,
            timeUntilReset: "Ready",
          },
        ],
        timestamp: new Date("2025-01-01T12:00:00Z"),
      };
      mockBridge.fetchQuota.mockResolvedValue(snapshot);

      await usage(false);

      expect(clearSpy).toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it("should render exhausted models section", async () => {
      const snapshot: QuotaSnapshot = {
        userName: "User",
        email: "",
        planName: "Free",
        models: [
          {
            label: "Available",
            modelId: "a",
            remainingPercent: 50,
            isExhausted: false,
            resetTime: null,
            timeUntilReset: "Ready",
          },
          {
            label: "Exhausted",
            modelId: "b",
            remainingPercent: 0,
            isExhausted: true,
            resetTime: null,
            timeUntilReset: "2h 0m",
          },
        ],
        timestamp: new Date(),
      };
      mockBridge.fetchQuota.mockResolvedValue(snapshot);

      await usage(false);
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it("should handle empty models", async () => {
      const snapshot: QuotaSnapshot = {
        userName: "User",
        email: "",
        planName: "Free",
        models: [],
        timestamp: new Date(),
      };
      mockBridge.fetchQuota.mockResolvedValue(snapshot);

      await usage(false);
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe("json mode", () => {
    it("should output JSON error when connection fails", async () => {
      mockBridge.fetchQuota.mockResolvedValue(null);

      await expect(usage(true)).rejects.toThrow("process.exit");

      expect(consoleSpy).toHaveBeenCalledWith(
        JSON.stringify({ error: "Failed to connect" }),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it("should output valid JSON with quota data", async () => {
      const now = new Date("2025-06-01T10:00:00Z");
      const resetTime = new Date("2025-06-01T12:00:00Z");
      const snapshot: QuotaSnapshot = {
        userName: "JsonUser",
        email: "json@test.com",
        planName: "Team",
        promptCredits: {
          available: 500,
          monthly: 2000,
          usedPercent: 75,
          remainingPercent: 25,
        },
        models: [
          {
            label: "Model A",
            modelId: "model-a",
            remainingPercent: 90,
            isExhausted: false,
            resetTime,
            timeUntilReset: "2h 0m",
          },
          {
            label: "Model B",
            modelId: "model-b",
            remainingPercent: 0,
            isExhausted: true,
            resetTime: null,
            timeUntilReset: "Ready",
          },
        ],
        timestamp: now,
      };
      mockBridge.fetchQuota.mockResolvedValue(snapshot);

      await usage(true);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(output.userName).toBe("JsonUser");
      expect(output.email).toBe("json@test.com");
      expect(output.planName).toBe("Team");
      expect(output.promptCredits.available).toBe(500);
      expect(output.promptCredits.monthly).toBe(2000);
      expect(output.models).toHaveLength(2);
      expect(output.models[0].label).toBe("Model A");
      expect(output.models[0].resetTime).toBe("2025-06-01T12:00:00.000Z");
      expect(output.models[1].resetTime).toBeNull();
      expect(output.timestamp).toBe("2025-06-01T10:00:00.000Z");
    });

    it("should output null for promptCredits when not available", async () => {
      const snapshot: QuotaSnapshot = {
        userName: "User",
        email: "",
        planName: "Free",
        models: [],
        timestamp: new Date("2025-01-01T00:00:00Z"),
      };
      mockBridge.fetchQuota.mockResolvedValue(snapshot);

      await usage(true);

      const output = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(output.promptCredits).toBeNull();
      expect(output.models).toEqual([]);
    });
  });
});
