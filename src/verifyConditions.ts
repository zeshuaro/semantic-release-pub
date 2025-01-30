import core from "@actions/core";
import SemanticReleaseError from "@semantic-release/error";
import { execa } from "execa";
import { VerifyConditionsContext } from "semantic-release";
import { PluginConfig } from "./types.js";
import { getConfig, getGoogleIdentityToken } from "./utils.js";

export const verifyConditions = async (
  pluginConfig: PluginConfig,
  { logger }: VerifyConditionsContext,
) => {
  const { cli, publishPub, useGithubOidc } = getConfig(pluginConfig);
  if (publishPub) {
    await verifyPublishToken(useGithubOidc);
    await verifyCommand(cli);
  } else {
    logger.log(
      `Skipping publish token and ${cli} CLI verification as publishPub is ${publishPub}`,
    );
  }
};

const verifyPublishToken = async (useGithubOidc: boolean) => {
  if (useGithubOidc) {
    try {
      await core.getIDToken();
    } catch (error) {
      throw new SemanticReleaseError(
        `Failed to get GitHub OIDC token: ${error}`,
      );
    }
  } else {
    const { GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;
    if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new SemanticReleaseError(
        "Environment variable not found: GOOGLE_SERVICE_ACCOUNT_KEY",
      );
    } else {
      await getGoogleIdentityToken(GOOGLE_SERVICE_ACCOUNT_KEY);
    }
  }
};

const verifyCommand = async (command: string) => {
  try {
    await execa(command);
  } catch (error) {
    throw new SemanticReleaseError(`${command} returned an error: ${error}`);
  }
};
