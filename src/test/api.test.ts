import { describe, it, expect, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import airQualityHandler from "../../api/air-quality.js";
import generatePlanHandler from "../../api/generate-plan.js";
import chatHandler from "../../api/chat.js";
import {
  checkRateLimit,
  getCached,
  setCached,
} from "../../src/lib/rateLimit.js";
import { DEFAULT_DELHI_PROFILE } from "../../src/types/index.js";

describe("In-memory Rate Limiter and Cache (src/lib/rateLimit.ts)", () => {
  it("allows requests within limit and throttles beyond limit", () => {
    const testIp = "192.168.1.100";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(testIp, 5, 5000).allowed).toBe(true);
    }
    expect(checkRateLimit(testIp, 5, 5000).allowed).toBe(false);
  });

  it("stores and retrieves cached items before TTL expiry", () => {
    setCached("test_key", { foo: "bar" }, 1000);
    expect(getCached("test_key")).toEqual({ foo: "bar" });
  });
});

describe("API Handlers with Mocked Network Requests", () => {
  it("air-quality handler returns 400 on invalid city query", async () => {
    const req = {
      method: "GET",
      headers: {},
      socket: {},
      query: { city: "a" },
    } as unknown as VercelRequest;

    let statusCode = 0;
    let jsonResult: Record<string, unknown> = {};
    const res = {
      setHeader: vi.fn(),
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: Record<string, unknown>) => {
            jsonResult = data;
          },
        };
      },
    } as unknown as VercelResponse;

    await airQualityHandler(req, res);
    expect(statusCode).toBe(400);
    expect(jsonResult.error).toBeDefined();
  });

  it("generate-plan handler produces deterministic fallback when API key missing", async () => {
    const req = {
      method: "POST",
      headers: {},
      socket: {},
      body: {
        profile: DEFAULT_DELHI_PROFILE,
        aqi: 350,
        band: "Very Poor",
        pm25: 180,
      },
    } as unknown as VercelRequest;

    let statusCode = 0;
    let jsonResult: Record<string, unknown> = {};
    const res = {
      setHeader: vi.fn(),
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: Record<string, unknown>) => {
            jsonResult = data;
          },
        };
      },
    } as unknown as VercelResponse;

    await generatePlanHandler(req, res);
    expect(statusCode).toBe(200);
    expect(jsonResult.headline).toBeDefined();
    expect(jsonResult.fallbackUsed).toBe(true);
  });

  it("chat handler returns safe guidance even when offline", async () => {
    const req = {
      method: "POST",
      headers: {},
      socket: {},
      body: {
        message: "Can my child play soccer outside?",
        city: "Delhi",
        aqi: 320,
        band: "Very Poor",
      },
    } as unknown as VercelRequest;

    let statusCode = 0;
    let jsonResult: Record<string, unknown> = {};
    const res = {
      setHeader: vi.fn(),
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: Record<string, unknown>) => {
            jsonResult = data;
          },
        };
      },
    } as unknown as VercelResponse;

    await chatHandler(req, res);
    expect(statusCode).toBe(200);
    expect(jsonResult.reply).toBeTruthy();
  });
});
