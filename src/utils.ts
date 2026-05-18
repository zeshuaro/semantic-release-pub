import { readFileSync } from "node:fs";
import { getIDToken } from "@actions/core";
import SemanticReleaseError from "@semantic-release/error";
import { JWT } from "google-auth-library";
import { parse } from "yaml";
import { Pubspec, ServiceAccount } from "./schemas.js";
import type { PluginConfig } from "./types.js";

export const PUBSPEC_PATH = "pubspec.yaml";
export const PUB_DEV_URL = "https://pub.dev";

const DEFAULT_CONFIG: PluginConfig = {
  cli: "dart",
  publishPub: true,
  updateBuildNumber: false,
  useGithubOidc: false,
  registryUrl: PUB_DEV_URL,
};

export const getConfig = (config: PluginConfig): PluginConfig => {
  const merged = { ...DEFAULT_CONFIG, ...config };
  return {
    ...merged,
    registryUrl: merged.registryUrl.replace(/\/$/, ""),
  };
};

export const getGoogleIdentityToken = async (
  serviceAccountStr: string,
  registryUrl: string,
) => {
  const serviceAccountJson = getServiceAccount(serviceAccountStr);
  const jwtClient = new JWT({
    email: serviceAccountJson.client_email,
    key: serviceAccountJson.private_key,
    scopes: registryUrl,
  });

  const creds = await jwtClient.authorize();
  if (!creds.id_token) {
    throw new SemanticReleaseError(
      "Failed to retrieve identity token from Google",
    );
  }

  return creds.id_token;
};

export const getGithubIdentityToken = async (registryUrl: string) => {
  return getIDToken(registryUrl);
};

export const getPubspecString = () => {
  return readFileSync(PUBSPEC_PATH, "utf-8");
};

export const getPubspecFromString = (data: string) => {
  return Pubspec.parse(parse(data));
};

export const getPubspec = () => {
  const data = getPubspecString();
  return getPubspecFromString(data);
};

const getServiceAccount = (serviceAccountStr: string) => {
  try {
    return ServiceAccount.parse(JSON.parse(serviceAccountStr));
  } catch (error) {
    throw new SemanticReleaseError(`Invalid service account: ${error}`);
  }
};
