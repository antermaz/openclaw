import { describe, expect, it } from "vitest";
import { VERCEL_AI_GATEWAY_PROVIDER_ID } from "../index.js";
import { resolveApiKeyForProvider } from "../../../agents/model-auth.js";
import {
  withOnboardEnv,
  runNonInteractive,
  readJsonFile,
  expectApiKeyProfile,
} from "../../../../test/helpers/onboard-test-utils.js";

describe("Vercel AI Gateway onboard (non-interactive)", () => {
  it("stores Vercel AI Gateway API key and sets default model", async () => {
    await withOnboardEnv("openclaw-onboard-ai-gateway-", async ({ configPath, runtime }) => {
      await runNonInteractive(
        {
          nonInteractive: true,
          authChoice: "ai-gateway-api-key",
          aiGatewayApiKey: "gateway-test-key",
          skipHealth: true,
          skipChannels: true,
          skipSkills: true,
          json: true,
        },
        runtime,
      );

      const cfg = await readJsonFile<{
        auth?: { profiles?: Record<string, { provider?: string; mode?: string }> };
        agents?: { defaults?: { model?: { primary?: string } } };
      }>(configPath);

      expect(cfg.auth?.profiles?.[`${VERCEL_AI_GATEWAY_PROVIDER_ID}:default`]?.provider).toBe(VERCEL_AI_GATEWAY_PROVIDER_ID);
      expect(cfg.auth?.profiles?.[`${VERCEL_AI_GATEWAY_PROVIDER_ID}:default`]?.mode).toBe("api_key");
      expect(cfg.agents?.defaults?.model?.primary).toBe(
        "vercel-ai-gateway/anthropic/claude-opus-4.6",
      );
      await expectApiKeyProfile({
        profileId: `${VERCEL_AI_GATEWAY_PROVIDER_ID}:default`,
        provider: VERCEL_AI_GATEWAY_PROVIDER_ID,
        key: "gateway-test-key",
      });
    });
  }, 60_000);
});

describe("Vercel AI Gateway auth resolution", () => {
  it("resolves Vercel AI Gateway API key from env", async () => {
    const previousGatewayKey = process.env.AI_GATEWAY_API_KEY;

    try {
      process.env.AI_GATEWAY_API_KEY = "gateway-test-key";

      const resolved = await resolveApiKeyForProvider({
        provider: VERCEL_AI_GATEWAY_PROVIDER_ID,
        store: { version: 1, profiles: {} },
      });
      expect(resolved.apiKey).toBe("gateway-test-key");
      expect(resolved.source).toContain("AI_GATEWAY_API_KEY");
    } finally {
      if (previousGatewayKey === undefined) {
        delete process.env.AI_GATEWAY_API_KEY;
      } else {
        process.env.AI_GATEWAY_API_KEY = previousGatewayKey;
      }
    }
  });
});
