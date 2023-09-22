import { execa } from 'execa';
import { NextRelease, PublishContext } from 'semantic-release';
import { Signale } from 'signale';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { PluginConfig, publish } from '../src/index.js';
import { getConfig, getGoogleIdentityToken } from '../src/utils.js';

vi.mock('execa');
vi.mock('../src/utils');

describe('publish', () => {
  const cli = 'dart';
  const serviceAccount = 'serviceAccount';
  const idToken = 'idToken';
  const version = '1.2.3';
  const semanticReleasePubToken = 'SEMANTIC_RELEASE_PUB_TOKEN';

  const config: PluginConfig = { cli, publishPub: true };
  const nextRelease = mock<NextRelease>();
  const logger = mock<Signale>();
  const context = mock<PublishContext>();

  beforeEach(() => {
    nextRelease.version = version;
    context.logger = logger;
    context.nextRelease = nextRelease;

    vi.mocked(getConfig).mockReturnValue(config);
    vi.mocked(getGoogleIdentityToken).mockResolvedValue(idToken);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test('success', async () => {
    stubEnv();

    await publish(config, context);

    expect(process.env[semanticReleasePubToken]).toEqual(idToken);
    expect(getGoogleIdentityToken).toHaveBeenNthCalledWith(1, serviceAccount);
    expect(execa).toHaveBeenNthCalledWith(1, cli, [
      'pub',
      'token',
      'add',
      'https://pub.dev',
      `--env-var=${semanticReleasePubToken}`
    ]);
    expect(execa).toHaveBeenNthCalledWith(2, cli, [
      'pub',
      'publish',
      '--force'
    ]);
  });

  test('skip publish', async () => {
    const newConfig = { ...config, publishPub: false };
    vi.mocked(getConfig).mockReturnValue(newConfig);

    await publish(newConfig, context);

    expect(getGoogleIdentityToken).toBeCalledTimes(0);
    expect(execa).toBeCalledTimes(0);
  });

  const stubEnv = () =>
    vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_KEY', serviceAccount);
});
