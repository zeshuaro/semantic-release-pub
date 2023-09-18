import SemanticReleaseError from "@semantic-release/error";
import { execa } from "execa";
import { JWT } from "google-auth-library";
import { PUB_DEV_AUDIENCE } from "./consts.js";
import { ServiceAccount } from "./schemas.js";
import { PluginConfig } from "./types.js";
import { getConfig } from "./utils.js";

export const verifyConditions = async (pluginConfig: PluginConfig) => {
  const { cli } = getConfig(pluginConfig);
  const { GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new SemanticReleaseError(
      "Environment variable not found: GOOGLE_SERVICE_ACCOUNT_KEY",
    );
  }

  verifyCommand(cli);
  await getGoogleIdentityToken(GOOGLE_SERVICE_ACCOUNT_KEY);
};

const verifyCommand = (command: string) => {
  try {
    execa(command);
  } catch (error) {
    throw new SemanticReleaseError(`${command} returned an error: ${error}`);
  }
};

const getGoogleIdentityToken = async (serviceAccountStr: string) => {
  const serviceAccountJson = getServiceAccount(serviceAccountStr);
  const jwtClient = new JWT(
    serviceAccountJson.client_email,
    undefined,
    serviceAccountJson.private_key,
    PUB_DEV_AUDIENCE,
  );

  const creds = await jwtClient.authorize();
  if (!creds.id_token) {
    throw new SemanticReleaseError(
      "Failed to retrieve identity token from Google",
    );
  }

  return creds.id_token;
};

const getServiceAccount = (serviceAccountStr: string) => {
  try {
    return ServiceAccount.parse(JSON.parse(serviceAccountStr));
  } catch (error) {
    throw new SemanticReleaseError(`Invalid service account key: ${error}`);
  }
};
