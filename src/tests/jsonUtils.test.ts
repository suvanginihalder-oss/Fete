import { describe, it, expect } from "vitest";
import { stripFences, getErrorMessage } from "../lib/ai/jsonUtils";

describe("stripFences", () => {
  it("leaves plain JSON unchanged", () => {
    expect(stripFences('{"a":1}')).toBe('{"a":1}');
  });

  it("removes a ```json fence", () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("removes a fence with no language label", () => {
    expect(stripFences("```\n[1,2]\n```")).toBe("[1,2]");
  });

  it("handles an uppercase language label", () => {
    expect(stripFences("```JSON\n[1]\n```")).toBe("[1]");
  });

  it("trims surrounding whitespace", () => {
    expect(stripFences('   {"a":1}  \n')).toBe('{"a":1}');
  });

  it("returns an empty string for empty input", () => {
    expect(stripFences("")).toBe("");
  });
});

describe("getErrorMessage", () => {
  it("reads the message from an Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns a thrown string as it is", () => {
    expect(getErrorMessage("plain text")).toBe("plain text");
  });

  it("returns a fallback for any other value", () => {
    expect(getErrorMessage(42)).toBe("Unknown error");
    expect(getErrorMessage(null)).toBe("Unknown error");
    expect(getErrorMessage({ code: 1 })).toBe("Unknown error");
  });
});
