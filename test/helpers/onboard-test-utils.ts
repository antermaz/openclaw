import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { expect } from "vitest";
import { captureEnv } from "../../src/test-utils/env.js";

export type RuntimeMock = {
  log: (...args: unknown[]) => void;
  error: (msg: string) => never;
  exit: (code: number) => never;
};

export type OnboardEnv = {
  configPath: string;
  runtime: RuntimeMock;
};

export async function removeDirWithRetry(dir: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      const isTransient = code === "ENOTEMPTY" || code === "EBUSY" || code === "EPERM";
      if (!isTransient || attempt === 4) {
        throw error;
      }
      await delay(25 * (attempt + 1));
    }
  }
}

export async function withOnboardEnv(
  prefix: string,
  run: (ctx: OnboardEnv) => Promise<void>,
): Promise<void> {
  const prev = captureEnv([
    "HOME",
    "OPENCLAW_STATE_DIR",
    "OPENCLAW_CONFIG_PATH",
    "OPENCLAW_SKIP_CHANNELS",
    "OPENCLAW_SKIP_GMAIL_WATCHER",
    "OPENCLAW_SKIP_CRON",
    "OPENCLAW_SKIP_CANVAS_HOST",
    "OPENCLAW_GATEWAY_TOKEN",
    "OPENCLAW_GATEWAY_PASSWORD",
    "CUSTOM_API_KEY",
    "OPENCLAW_DISABLE_CONFIG_CACHE",
    "AI_GATEWAY_API_KEY",
  ]);

  process.env.OPENCLAW_SKIP_CHANNELS = "1";
  process.env.OPENCLAW_SKIP_GMAIL_WATCHER = "1";
  process.env.OPENCLAW_SKIP_CRON = "1";
  process.env.OPENCLAW_SKIP_CANVAS_HOST = "1";
  process.env.OPENCLAW_DISABLE_CONFIG_CACHE = "1";
  delete process.env.OPENCLAW_GATEWAY_TOKEN;
  delete process.env.OPENCLAW_GATEWAY_PASSWORD;
  delete process.env.CUSTOM_API_KEY;
  delete process.env.AI_GATEWAY_API_KEY;

  const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const configPath = path.join(tempHome, "openclaw.json");
  process.env.HOME = tempHome;
  process.env.OPENCLAW_STATE_DIR = tempHome;
  process.env.OPENCLAW_CONFIG_PATH = configPath;

  const runtime: RuntimeMock = {
    log: () => {},
    error: (msg: string) => {
      throw new Error(msg);
    },
    exit: (code: number) => {
      throw new Error(`exit:${code}`);
    },
  };

  try {
    await run({ configPath, runtime });
  } finally {
    await removeDirWithRetry(tempHome);
    prev.restore();
  }
}

export async function runNonInteractive(
  options: Record<string, unknown>,
  runtime: RuntimeMock,
): Promise<void> {
  const { runNonInteractiveOnboarding } = await import("../../src/commands/onboard-non-interactive.js");
  await runNonInteractiveOnboarding(options, runtime);
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function expectApiKeyProfile(params: {
  profileId: string;
  provider: string;
  key: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  const { ensureAuthProfileStore } = await import("../../src/agents/auth-profiles.js");
  const store = ensureAuthProfileStore();
  const profile = store.profiles[params.profileId];
  expect(profile?.type).toBe("api_key");
  if (profile?.type === "api_key") {
    expect(profile.provider).toBe(params.provider);
    expect(profile.key).toBe(params.key);
    if (params.metadata) {
      expect(profile.metadata).toEqual(params.metadata);
    }
  }
}
