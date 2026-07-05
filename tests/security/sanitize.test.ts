import { describe, it, expect } from "vitest";
import { sanitizeInput } from "@/lib/validation/sanitize";

describe("sanitizeInput — NoSQL injection protection", () => {
  it("strips MongoDB operator keys", () => {
    const attack = { email: { $gt: "" }, password: { $gt: "" } };
    const result = sanitizeInput(attack) as any;
    expect(result.email).toEqual({});
    expect(result.password).toEqual({});
  });

  it("leaves normal input untouched", () => {
    const input = { email: "test@test.com", password: "hello123" };
    expect(sanitizeInput(input)).toEqual(input);
  });

  it("strips dotted-path keys", () => {
    const attack = { "user.role": "admin" };
    const result = sanitizeInput(attack) as any;
    expect(result["user.role"]).toBeUndefined();
  });
});

describe("sanitizeInput — prototype pollution protection", () => {
  it("strips __proto__ keys", () => {
    const attack = JSON.parse('{"__proto__":{"isAdmin":true},"name":"test"}');
    const result = sanitizeInput(attack) as any;
    expect(result.__proto__).not.toEqual({ isAdmin: true });
    expect(result.name).toBe("test");
  });

  it("strips constructor and prototype keys", () => {
    const attack = { constructor: "bad", prototype: "bad", name: "ok" };
    const result = sanitizeInput(attack) as any;
    expect(result.constructor).not.toBe("bad");
    expect(result.prototype).toBeUndefined();
    expect(result.name).toBe("ok");
  });
});