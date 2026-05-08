import SemanticReleaseError from "@semantic-release/error";
import { execa } from "execa";
import type { PublishContext } from "semantic-release";
import type { Signale } from "signale";
import type { PluginConfig } from "./types.js";
import {
  getConfig,
  getGithubIdentityToken,
  getGoogleIdentityToken,
  getPubspec,
} from "./utils.js";

const SEMANTIC_RELEASE_PUB_TOKEN = "SEMANTIC_RELEASE_PUB_TOKEN";

export const publish = async (
  pluginConfig: PluginConfig,
  { nextRelease: { version }, logger }: PublishContext,
) => {
  const { cli, publishPub, useGithubOidc, pkgRoot, registryUrl } =
    getConfig(pluginConfig);
  if (!publishPub) {
    logger.log(`Skipping publishing to pub.dev as publishPub is ${publishPub}`);
    return;
  }

  const pubspec = getPubspec(pkgRoot);
  const pubToken = await getPubToken(useGithubOidc, registryUrl, logger);
  await setPubToken(cli, pubToken, registryUrl);

  logger.log(`Publishing version ${version} to ${registryUrl}`);
  await execa(cli, ["pub", "publish", "--force"], { cwd: pkgRoot });
  logger.log(`Published ${pubspec.name}@${version} on ${registryUrl}`);

  return {
    name: "pub.dev package",
    url: `${registryUrl}/packages/${pubspec.name}/versions/${version}`,
  };
};

const getPubToken = async (
  useGithubOidc: boolean,
  registryUrl: string,
  logger: Signale,
) => {
  if (useGithubOidc) {
    logger.log(`Using GitHub OIDC token to publish to ${registryUrl}`);
    return await getGithubIdentityToken(registryUrl);
  }

  logger.log(`Using Google identity token to publish to ${registryUrl}`);
  const { GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;
  if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new SemanticReleaseError(
      "Environment variable not found: GOOGLE_SERVICE_ACCOUNT_KEY",
    );
  }

  return await getGoogleIdentityToken(GOOGLE_SERVICE_ACCOUNT_KEY, registryUrl);
};

const setPubToken = async (
  cli: string,
  idToken: string,
  registryUrl: string,
) => {
  process.env[SEMANTIC_RELEASE_PUB_TOKEN] = idToken;
  await execa(cli, [
    "pub",
    "token",
    "add",
    registryUrl,
    `--env-var=${SEMANTIC_RELEASE_PUB_TOKEN}`,
  ]);
};
