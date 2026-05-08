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
  getPubspecPath,
  getPubspecString,
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

const pubDevAudience = "https://pub.dev";

describe("getConfig", () => {
  const config: PluginConfig = {
    cli: "flutter",
    publishPub: false,
    updateBuildNumber: false,
    useGithubOidc: false,
  };

  test("success", () => {
    expect(getConfig(config)).toEqual(config);
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

  test("success", async () => {
    creds.id_token = idToken;
    authorize.mockResolvedValue(creds);

    const actual = await getGoogleIdentityToken(serviceAccount);

    expect(actual).toEqual(idToken);
    expectJwtCalled();
    expect(authorize).toHaveBeenCalledTimes(1);
  });

  test("error due to invalid service account", async () => {
    await expect(() =>
      getGoogleIdentityToken("clearlyInvalid"),
    ).rejects.toThrow(SemanticReleaseError);
    expect(JWT).toHaveBeenCalledTimes(0);
  });

  test("error due to missing id token", async () => {
    creds.id_token = null;
    authorize.mockResolvedValue(creds);

    await expect(() => getGoogleIdentityToken(serviceAccount)).rejects.toThrow(
      SemanticReleaseError,
    );

    expectJwtCalled();
    expect(authorize).toHaveBeenCalledTimes(1);
  });

  const expectJwtCalled = () => {
    expect(JWT).toHaveBeenNthCalledWith(1, {
      email: clientEmail,
      key: privateKey,
      scopes: pubDevAudience,
    });
  };
});

describe("getGithubIdentityToken", () => {
  const idToken = "idToken";

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("success", async () => {
    vi.mocked(getIDToken).mockResolvedValue(idToken);

    const actual = await getGithubIdentityToken();

    expect(actual).toEqual(idToken);
    expect(getIDToken).toHaveBeenNthCalledWith(1, pubDevAudience);
  });
});

describe("getPubspecPath", () => {
  test("returns default path without pkgRoot", () => {
    expect(getPubspecPath()).toEqual("pubspec.yaml");
  });

  test("joins pkgRoot with pubspec.yaml", () => {
    expect(getPubspecPath("packages/my_pkg")).toEqual(
      "packages/my_pkg/pubspec.yaml",
    );
  });
});

describe("pubspecUtils", () => {
  const pubspecPath = "pubspec.yaml";
  const pkgRoot = "packages/my_pkg";
  const pkgRootPubspecPath = "packages/my_pkg/pubspec.yaml";
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
    test("success without pkgRoot", () => {
      const actual = getPubspecString();

      expect(actual).toEqual(fileContent);
      expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
    });

    test("success with pkgRoot", () => {
      const actual = getPubspecString(pkgRoot);

      expect(actual).toEqual(fileContent);
      expect(readFileSync).toHaveBeenNthCalledWith(
        1,
        pkgRootPubspecPath,
        "utf-8",
      );
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
    test("success without pkgRoot", () => {
      const actual = getPubspec();

      expect(actual).toEqual(pubspec);
      expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
      expect(parse).toHaveBeenNthCalledWith(1, fileContent);
    });

    test("success with pkgRoot", () => {
      const actual = getPubspec(pkgRoot);

      expect(actual).toEqual(pubspec);
      expect(readFileSync).toHaveBeenNthCalledWith(
        1,
        pkgRootPubspecPath,
        "utf-8",
      );
      expect(parse).toHaveBeenNthCalledWith(1, fileContent);
    });
  });
});
