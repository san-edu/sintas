import { describe, expect, it } from "vitest";
import { parseEnv } from "../../src/config/env.js";

describe("environment configuration", () => {
  it("rejects malformed environment values", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: "not-a-url", PORT: "invalid" }),
    ).toThrow();
  });

  it("parses the required configuration", () => {
    expect(
      parseEnv({
        DATABASE_URL: "mysql://user:pass@localhost:3306/app",
        PORT: "4000",
      }),
    ).toMatchObject({
      DATABASE_URL: "mysql://user:pass@localhost:3306/app",
      PORT: 4000,
    });
  });

  it("rejects the development secret and localhost CORS in production", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        DATABASE_URL: "mysql://user:pass@localhost:3306/app",
      }),
    ).toThrow();
  });
});
