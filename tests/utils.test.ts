import SemanticReleaseError from "@semantic-release/error";
import { codeBlock } from "common-tags";
import { readFileSync } from "fs";
import { Credentials, JWT } from "google-auth-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { parse } from "yaml";
import { PluginConfig } from "../src";
import {
  getConfig,
  getGoogleIdentityToken,
  getPubspecFromString,
  getPubspecString,
} from "../src/utils";

vi.mock("google-auth-library");
vi.mock("fs");
vi.mock("yaml");

describe("getConfig", () => {
  const config: PluginConfig = {
    cli: "flutter",
    publishPub: false,
    updateBuildNumber: false,
  };

  test("success", () => {
    expect(getConfig(config)).toEqual(config);
  });
});

describe("getGoogleIdentityToken", () => {
  const idToken = "idToken";
  const clientEmail = "clientEmail";
  const privateKey = "privateKey";
  const pubDevAudience = "https://pub.dev";

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

  test("success", async () => {
    creds.id_token = idToken;
    const authorize = vi.fn().mockResolvedValue(creds);
    const jwtClient = mock<JWT>({ authorize });
    vi.mocked(JWT).mockReturnValue(jwtClient);

    const actual = await getGoogleIdentityToken(serviceAccount);

    expect(actual).toEqual(idToken);
    expectJwtCalled();
    expect(authorize).toBeCalledTimes(1);
  });

  test("error due to invalid service account", async () => {
    await expect(() =>
      getGoogleIdentityToken("clearlyInvalid"),
    ).rejects.toThrowError(SemanticReleaseError);
    expect(JWT).toBeCalledTimes(0);
  });

  test("error due to missing id token", async () => {
    creds.id_token = null;
    const authorize = vi.fn().mockResolvedValue(creds);
    const jwtClient = mock<JWT>({ authorize });
    vi.mocked(JWT).mockReturnValue(jwtClient);

    await expect(() =>
      getGoogleIdentityToken(serviceAccount),
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
      pubDevAudience,
    );
  };
});

describe("getPubspecString", () => {
  const pubspecPath = "pubspec.yaml";
  const fileContent = "fileContent";

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("success", () => {
    vi.mocked(readFileSync).mockReturnValue(fileContent);

    const actual = getPubspecString();

    expect(actual).toEqual(fileContent);
    expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
  });
});

describe("getPubspecFromString", () => {
  const fileContent = "fileContent";
  const pubspec = {
    version: "1.0.0",
  };

  test("success", () => {
    vi.mocked(parse).mockReturnValue(pubspec);

    const actual = getPubspecFromString(fileContent);

    expect(actual).toEqual(pubspec);
    expect(parse).toHaveBeenNthCalledWith(1, fileContent);
  });
});
