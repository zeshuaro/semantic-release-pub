import SemanticReleaseError from "@semantic-release/error";
import { execa } from "execa";
import { PluginConfig } from "./types.js";
import { getConfig, getGoogleIdentityToken } from "./utils.js";

export const verifyConditions = async (pluginConfig: PluginConfig) => {
  const { cli } = getConfig(pluginConfig);
  const { GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new SemanticReleaseError(
      "Environment variable not found: GOOGLE_SERVICE_ACCOUNT_KEY",
    );
  }

  await verifyCommand(cli);
  await getGoogleIdentityToken(GOOGLE_SERVICE_ACCOUNT_KEY);
};

const verifyCommand = async (command: string) => {
  try {
    await execa(command);
  } catch (error) {
    throw new SemanticReleaseError(`${command} returned an error: ${error}`);
  }
};
