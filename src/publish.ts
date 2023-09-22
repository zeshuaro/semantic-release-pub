import { execa } from 'execa';
import { PublishContext } from 'semantic-release';
import { PluginConfig } from './types.js';
import { getConfig, getGoogleIdentityToken } from './utils.js';

const SEMANTIC_RELEASE_PUB_TOKEN = 'SEMANTIC_RELEASE_PUB_TOKEN';

export const publish = async (
  pluginConfig: PluginConfig,
  { nextRelease: { version }, logger }: PublishContext
) => {
  const { cli, publishPub } = getConfig(pluginConfig);
  if (!publishPub) {
    logger.log(`Skipping publishing to pub.dev as publishPub is ${publishPub}`);
    return;
  }

  const { GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;

  const idToken = await getGoogleIdentityToken(GOOGLE_SERVICE_ACCOUNT_KEY);
  await setPubToken(cli, idToken);

  logger.log(`Publishing version ${version} to pub.dev`);
  await execa(cli, ['pub', 'publish', '--force']);
  logger.log('Published package');
};

const setPubToken = async (cli: string, idToken: string) => {
  process.env[SEMANTIC_RELEASE_PUB_TOKEN] = idToken;
  await execa(cli, [
    'pub',
    'token',
    'add',
    'https://pub.dev',
    `--env-var=${SEMANTIC_RELEASE_PUB_TOKEN}`
  ]);
};
