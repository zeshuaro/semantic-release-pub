import SemanticReleaseError from '@semantic-release/error';
import { codeBlock } from 'common-tags';
import { Credentials, JWT } from 'google-auth-library';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { PluginConfig } from '../src';
import { getConfig, getGoogleIdentityToken } from '../src/utils';

vi.mock('google-auth-library');

describe('getConfig', () => {
  const config: PluginConfig = {
    cli: 'flutter',
    pubspecPath: 'a/pubspec.yaml'
  };

  test('success', () => {
    expect(getConfig(config)).toEqual(config);
  });
});

describe('getGoogleIdentityToken', () => {
  const idToken = 'idToken';
  const clientEmail = 'clientEmail';
  const privateKey = 'privateKey';
  const pubDevAudience = 'https://pub.dev';

  const creds = mock<Credentials>();

  const serviceAccount = codeBlock`
    {
      "client_email": "${clientEmail}",
      "private_key": "${privateKey}"
    }
  `;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('success', async () => {
    creds.id_token = idToken;
    const authorize = vi.fn().mockResolvedValue(creds);
    const jwtClient = mock<JWT>({ authorize });
    vi.mocked(JWT).mockReturnValue(jwtClient);

    const actual = await getGoogleIdentityToken(serviceAccount);

    expect(actual).toEqual(idToken);
    expectJwtCalled();
    expect(authorize).toBeCalledTimes(1);
  });

  test('error due to invalid service account', async () => {
    await expect(() =>
      getGoogleIdentityToken('clearlyInvalid')
    ).rejects.toThrowError(SemanticReleaseError);
    expect(JWT).toBeCalledTimes(0);
  });

  test('error due to missing id token', async () => {
    creds.id_token = null;
    const authorize = vi.fn().mockResolvedValue(creds);
    const jwtClient = mock<JWT>({ authorize });
    vi.mocked(JWT).mockReturnValue(jwtClient);

    await expect(() =>
      getGoogleIdentityToken(serviceAccount)
    ).rejects.toThrowError(SemanticReleaseError);

    expectJwtCalled();
    expect(authorize).toBeCalledTimes(1);
  });

  const expectJwtCalled = () => {
    expect(JWT).toHaveBeenNthCalledWith(
      1,
      clientEmail,
      undefined,
      privateKey,
      pubDevAudience
    );
  };
});
