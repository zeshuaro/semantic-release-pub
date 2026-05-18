import { readFileSync } from "node:fs";
import { getIDToken } from "@actions/core";
import SemanticReleaseError from "@semantic-release/error";
import { codeBlock } from "common-tags";
import { type Credentials, JWT } from "google-auth-library";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { parse } from "yaml";
import type { PluginConfig } from "../src/index.js";
import {
  getConfig,
  getGithubIdentityToken,
  getGoogleIdentityToken,
  getPubspec,
  getPubspecFromString,
  getPubspecString,
  PUB_DEV_URL,
} from "../src/utils.js";

vi.mock("@actions/core");
vi.mock("fs");
vi.mock("yaml");

const authorize = vi.fn();
vi.mock("google-auth-library", () => ({
  JWT: vi.fn(
    class {
      authorize = authorize;
    },
  ),
}));

describe("getConfig", () => {
  const config: PluginConfig = {
    cli: "flutter",
    publishPub: false,
    updateBuildNumber: false,
    useGithubOidc: false,
    registryUrl: PUB_DEV_URL,
  };

  test("success with all fields provided", () => {
    expect(getConfig(config)).toEqual(config);
  });

  test("applies default registryUrl when not provided", () => {
    const { registryUrl: _omitted, ...configWithoutRegistry } = config;
    expect(getConfig(configWithoutRegistry as PluginConfig)).toMatchObject({
      registryUrl: PUB_DEV_URL,
    });
  });
});

describe("getGoogleIdentityToken", () => {
  const idToken = "idToken";
  const clientEmail = "clientEmail";
  const privateKey = "privateKey";

  const creds = mock<Credentials>();

  const serviceAccount = codeBlock`
    {
      "client_email": "${clientEmail}",
      "private_key": "${privateKey}"
    }
  `;

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("success with default pub.dev audience", async () => {
    creds.id_token = idToken;
    authorize.mockResolvedValue(creds);

    const actual = await getGoogleIdentityToken(serviceAccount, PUB_DEV_URL);

    expect(actual).toEqual(idToken);
    expectJwtCalled(PUB_DEV_URL);
    expect(authorize).toHaveBeenCalledTimes(1);
  });

  test("success with custom registry URL", async () => {
    const customUrl = "https://my-registry.example.com";
    creds.id_token = idToken;
    authorize.mockResolvedValue(creds);

    const actual = await getGoogleIdentityToken(serviceAccount, customUrl);

    expect(actual).toEqual(idToken);
    expectJwtCalled(customUrl);
    expect(authorize).toHaveBeenCalledTimes(1);
  });

  test("error due to invalid service account", async () => {
    await expect(() =>
      getGoogleIdentityToken("clearlyInvalid", PUB_DEV_URL),
    ).rejects.toThrow(SemanticReleaseError);
    expect(JWT).toHaveBeenCalledTimes(0);
  });

  test("error due to missing id token", async () => {
    creds.id_token = null;
    authorize.mockResolvedValue(creds);

    await expect(() =>
      getGoogleIdentityToken(serviceAccount, PUB_DEV_URL),
    ).rejects.toThrow(SemanticReleaseError);

    expectJwtCalled(PUB_DEV_URL);
    expect(authorize).toHaveBeenCalledTimes(1);
  });

  const expectJwtCalled = (registryUrl: string) => {
    expect(JWT).toHaveBeenNthCalledWith(1, {
      email: clientEmail,
      key: privateKey,
      scopes: registryUrl,
    });
  };
});

describe("getGithubIdentityToken", () => {
  const idToken = "idToken";

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("success with default pub.dev audience", async () => {
    vi.mocked(getIDToken).mockResolvedValue(idToken);

    const actual = await getGithubIdentityToken(PUB_DEV_URL);

    expect(actual).toEqual(idToken);
    expect(getIDToken).toHaveBeenNthCalledWith(1, PUB_DEV_URL);
  });

  test("success with custom registry URL", async () => {
    const customUrl = "https://my-registry.example.com";
    vi.mocked(getIDToken).mockResolvedValue(idToken);

    const actual = await getGithubIdentityToken(customUrl);

    expect(actual).toEqual(idToken);
    expect(getIDToken).toHaveBeenNthCalledWith(1, customUrl);
  });
});

describe("pubspecUtils", () => {
  const pubspecPath = "pubspec.yaml";
  const fileContent = "fileContent";
  const pubspec = {
    name: "pub_package",
    version: "1.0.0",
  };

  beforeEach(() => {
    vi.mocked(readFileSync).mockReturnValue(fileContent);
    vi.mocked(parse).mockReturnValue(pubspec);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getPubspecString", () => {
    test("success", () => {
      const actual = getPubspecString();

      expect(actual).toEqual(fileContent);
      expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
    });
  });

  describe("getPubspecFromString", () => {
    test("success", () => {
      const actual = getPubspecFromString(fileContent);

      expect(actual).toEqual(pubspec);
      expect(parse).toHaveBeenNthCalledWith(1, fileContent);
    });
  });

  describe("getPubspec", () => {
    test("success", () => {
      const actual = getPubspec();

      expect(actual).toEqual(pubspec);
      expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
      expect(parse).toHaveBeenNthCalledWith(1, fileContent);
    });
  });
});
