import SemanticReleaseError from '@semantic-release/error';
import { execa } from 'execa';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PluginConfig, verifyConditions } from '../src/index.js';
import { getConfig, getGoogleIdentityToken } from '../src/utils.js';

vi.mock('execa');
vi.mock('google-auth-library');
vi.mock('../src/utils');

describe('verifyConditions', () => {
  const cli = 'dart';
  const pubspecPath = 'pubspecPath';
  const serviceAccount = 'serviceAccount';
  const idToken = 'idToken';

  const config: PluginConfig = { cli, pubspecPath };

  beforeEach(() => {
    vi.mocked(getConfig).mockReturnValue(config);
    vi.mocked(getGoogleIdentityToken).mockResolvedValue(idToken);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test('success', async () => {
    stubEnv();

    await verifyConditions(config);

    expect(execa).toBeCalledWith(cli);
    expect(getGoogleIdentityToken).toHaveBeenNthCalledWith(1, serviceAccount);
  });

  test('error due to missing environment variable', async () => {
    await expectSemanticReleaseError();

    expect(execa).toBeCalledTimes(0);
    expect(getGoogleIdentityToken).toBeCalledTimes(0);
  });

  test('error due to execa', async () => {
    stubEnv();
    vi.mocked(execa).mockImplementation(() => {
      throw new Error();
    });

    await expectSemanticReleaseError();

    expect(execa).toBeCalledWith(cli);
    expect(getGoogleIdentityToken).toBeCalledTimes(0);
  });

  const stubEnv = () =>
    vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_KEY', serviceAccount);

  const expectSemanticReleaseError = async () => {
    await expect(() => verifyConditions(config)).rejects.toThrowError(
      SemanticReleaseError
    );
  };
});
