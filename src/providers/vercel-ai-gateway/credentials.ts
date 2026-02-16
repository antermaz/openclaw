import { resolveOpenClawAgentDir } from "../../agents/agent-paths.js";
import { upsertAuthProfile } from "../../agents/auth-profiles.js";
import { VERCEL_AI_GATEWAY_PROVIDER_ID } from "./constants.js";

const resolveAuthAgentDir = (agentDir?: string) => agentDir ?? resolveOpenClawAgentDir();

export async function setVercelAiGatewayApiKey(key: string, agentDir?: string) {
  upsertAuthProfile({
    profileId: `${VERCEL_AI_GATEWAY_PROVIDER_ID}:default`,
    credential: {
      type: "api_key",
      provider: VERCEL_AI_GATEWAY_PROVIDER_ID,
      key,
    },
    agentDir: resolveAuthAgentDir(agentDir),
  });
}
