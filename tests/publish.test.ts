import { execa } from "execa";
import { NextRelease, PublishContext } from "semantic-release";
import { Signale } from "signale";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { PluginConfig, publish } from "../src/index.js";
import { Pubspec } from "../src/schemas.js";
import {
  getConfig,
  getGithubIdentityToken,
  getGoogleIdentityToken,
  getPubspec,
} from "../src/utils.js";

vi.mock("execa");
vi.mock("../src/utils");

describe("publish", () => {
  const cli = "dart";
  const serviceAccount = "serviceAccount";
  const googleIdToken = "googleIdToken";
  const githubIdToken = "githubIdToken";
  const version = "1.2.3";
  const semanticReleasePubToken = "SEMANTIC_RELEASE_PUB_TOKEN";

  const testConfig: PluginConfig = {
    cli,
    publishPub: true,
    updateBuildNumber: false,
    useGithubOidc: false,
  };

  const pubspec: Pubspec = {
    name: "pub_package",
    version,
  };

  const nextRelease = mock<NextRelease>();
  const logger = mock<Signale>();
  const context = mock<PublishContext>();

  beforeEach(() => {
    nextRelease.version = version;
    context.logger = logger;
    context.nextRelease = nextRelease;

    vi.mocked(getConfig).mockReturnValue(testConfig);
    vi.mocked(getGoogleIdentityToken).mockResolvedValue(googleIdToken);
    vi.mocked(getPubspec).mockReturnValue(pubspec);
    vi.mocked(getGithubIdentityToken).mockResolvedValue(githubIdToken);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("success", async () => {
    stubEnv();

    const actual = await publish(testConfig, context);

    expect(actual).toEqual({
      name: "pub.dev package",
      url: `https://pub.dev/packages/${pubspec.name}/versions/${version}`,
    });
    expect(process.env[semanticReleasePubToken]).toEqual(googleIdToken);

    expect(getGoogleIdentityToken).toHaveBeenNthCalledWith(1, serviceAccount);
    expect(execa).toHaveBeenNthCalledWith(1, cli, [
      "pub",
      "token",
      "add",
      "https://pub.dev",
      `--env-var=${semanticReleasePubToken}`,
    ]);
    expect(execa).toHaveBeenNthCalledWith(2, cli, [
      "pub",
      "publish",
      "--force",
    ]);
  });

  test("success with useGithubOidc=true", async () => {
    const config = { ...testConfig, useGithubOidc: true };
    vi.mocked(getConfig).mockReturnValue(config);

    const actual = await publish(config, context);

    expect(actual).toEqual({
      name: "pub.dev package",
      url: `https://pub.dev/packages/${pubspec.name}/versions/${version}`,
    });
    expect(process.env[semanticReleasePubToken]).toEqual(githubIdToken);

    expect(getGithubIdentityToken).toHaveBeenCalledOnce();
    expect(execa).toHaveBeenNthCalledWith(1, cli, [
      "pub",
      "token",
      "add",
      "https://pub.dev",
      `--env-var=${semanticReleasePubToken}`,
    ]);
    expect(execa).toHaveBeenNthCalledWith(2, cli, [
      "pub",
      "publish",
      "--force",
    ]);
  });

  test("skip publish", async () => {
    const newConfig = { ...testConfig, publishPub: false };
    vi.mocked(getConfig).mockReturnValue(newConfig);

    const actual = await publish(newConfig, context);

    expect(actual).toBeUndefined();
    expect(getGoogleIdentityToken).toBeCalledTimes(0);
    expect(execa).toBeCalledTimes(0);
  });

  const stubEnv = () =>
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", serviceAccount);
});
