import core from "@actions/core";
import { execa } from "execa";
import { PublishContext } from "semantic-release";
import { PluginConfig } from "./types.js";
import { getConfig, getGoogleIdentityToken, getPubspec } from "./utils.js";

const SEMANTIC_RELEASE_PUB_TOKEN = "SEMANTIC_RELEASE_PUB_TOKEN";

export const publish = async (
  pluginConfig: PluginConfig,
  { nextRelease: { version }, logger }: PublishContext,
) => {
  const { cli, publishPub, useGithubOidc } = getConfig(pluginConfig);
  if (!publishPub) {
    logger.log(`Skipping publishing to pub.dev as publishPub is ${publishPub}`);
    return;
  }

  const pubspec = getPubspec();
  const pubToken = await getPubToken(useGithubOidc);
  await setPubToken(cli, pubToken);

  logger.log(`Publishing version ${version} to pub.dev`);
  await execa(cli, ["pub", "publish", "--force"]);
  logger.log(`Published ${pubspec.name}@${version} on pub.dev`);

  return {
    name: "pub.dev package",
    url: `https://pub.dev/packages/${pubspec.name}/versions/${version}`,
  };
};

const getPubToken = async (useGithubOidc: boolean) => {
  if (useGithubOidc) {
    return await core.getIDToken();
  }

  const { GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;
  return await getGoogleIdentityToken(GOOGLE_SERVICE_ACCOUNT_KEY);
};

const setPubToken = async (cli: string, idToken: string) => {
  process.env[SEMANTIC_RELEASE_PUB_TOKEN] = idToken;
  await execa(cli, [
    "pub",
    "token",
    "add",
    "https://pub.dev",
    `--env-var=${SEMANTIC_RELEASE_PUB_TOKEN}`,
  ]);
};
