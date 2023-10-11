import SemanticReleaseError from '@semantic-release/error';
import { execa } from 'execa';
import { VerifyConditionsContext } from 'semantic-release';
import { PluginConfig } from './types.js';
import { getConfig, getGoogleIdentityToken } from './utils.js';

export const verifyConditions = async (
  pluginConfig: PluginConfig,
  { logger }: VerifyConditionsContext
) => {
  const { cli, publishPub } = getConfig(pluginConfig);
  const { GOOGLE_SERVICE_ACCOUNT_KEY } = process.env;

  if (publishPub) {
    if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new SemanticReleaseError(
        'Environment variable not found: GOOGLE_SERVICE_ACCOUNT_KEY'
      );
    }

    await getGoogleIdentityToken(GOOGLE_SERVICE_ACCOUNT_KEY);
  } else {
    logger.log(
      `Skipping Google service account key verification as publishPub is ${publishPub}`
    );
  }

  await verifyCommand(cli);
};

const verifyCommand = async (command: string) => {
  try {
    await execa(command);
  } catch (error) {
    throw new SemanticReleaseError(`${command} returned an error: ${error}`);
  }
};
