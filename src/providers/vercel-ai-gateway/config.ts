import type { OpenClawConfig } from "../../config/config.js";
import { applyAgentDefaultModelPrimary } from "../../commands/onboard-auth.config-shared.js";
import { VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF } from "./constants.js";

export function applyVercelAiGatewayProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF] = {
    ...models[VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF],
    alias: models[VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF]?.alias ?? "Vercel AI Gateway",
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
  };
}

export function applyVercelAiGatewayConfig(cfg: OpenClawConfig): OpenClawConfig {
  const next = applyVercelAiGatewayProviderConfig(cfg);
  return applyAgentDefaultModelPrimary(next, VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF);
}
