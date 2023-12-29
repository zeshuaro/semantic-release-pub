import SemanticReleaseError from "@semantic-release/error";
import { JWT } from "google-auth-library";
import { ServiceAccount } from "./schemas.js";
import { PluginConfig } from "./types.js";

const DEFAULT_CONFIG: PluginConfig = {
  cli: "dart",
  publishPub: true,
};

const PUB_DEV_AUDIENCE = "https://pub.dev";

export const getConfig = (config: PluginConfig): PluginConfig => {
  return { ...DEFAULT_CONFIG, ...config };
};

export const getGoogleIdentityToken = async (serviceAccountStr: string) => {
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
    throw new SemanticReleaseError(`Invalid service account: ${error}`);
  }
};
