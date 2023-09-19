import { execa } from "execa";
import { PluginConfig } from "./types.js";
import { getConfig, getGoogleIdentityToken } from "./utils.js";

const SEMANTIC_RELEASE_PUB_TOKEN = "SEMANTIC_RELEASE_PUB_TOKEN";

export const publish = async (pluginConfig: PluginConfig) => {
  const { cli } = getConfig(pluginConfig);
  const { GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;

  const idToken = await getGoogleIdentityToken(GOOGLE_SERVICE_ACCOUNT_KEY);
  setPubToken(cli, idToken);
  publishToPub(cli);
};

const setPubToken = (cli: string, idToken: string) => {
  process.env[SEMANTIC_RELEASE_PUB_TOKEN] = idToken;
  execa(cli, [
    "pub",
    "token",
    "add",
    "https://pub.dev",
    `--env-var=${SEMANTIC_RELEASE_PUB_TOKEN}`,
  ]);
};

const publishToPub = (cli: string) => {
  execa(cli, ["pub", "publish", "--force"]);
};
