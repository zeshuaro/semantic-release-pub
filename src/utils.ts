import { readFileSync } from "node:fs";
import core from "@actions/core";
import SemanticReleaseError from "@semantic-release/error";
import { JWT } from "google-auth-library";
import { parse } from "yaml";
import { Pubspec, ServiceAccount } from "./schemas.js";
import type { PluginConfig } from "./types.js";

export const PUBSPEC_PATH = "pubspec.yaml";
const DEFAULT_CONFIG: PluginConfig = {
  cli: "dart",
  publishPub: true,
  updateBuildNumber: false,
  useGithubOidc: false,
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

export const getGithubIdentityToken = async () => {
  return core.getIDToken(PUB_DEV_AUDIENCE);
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
