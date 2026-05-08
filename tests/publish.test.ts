import { execa } from "execa";
import type { NextRelease, PublishContext } from "semantic-release";
import type { Signale } from "signale";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { type PluginConfig, publish } from "../src/index.js";
import type { Pubspec } from "../src/schemas.js";
import {
  getConfig,
  getGithubIdentityToken,
  getGoogleIdentityToken,
  getPubspec,
  PUB_DEV_URL,
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
    pkgRoot: ".",
    registryUrl: PUB_DEV_URL,
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
    vi.clearAllMocks();
  });

  test("success", async () => {
    stubEnv();

    const actual = await publish(testConfig, context);

    expect(actual).toEqual({
      name: "pub.dev package",
      url: `${PUB_DEV_URL}/packages/${pubspec.name}/versions/${version}`,
    });
    expect(process.env[semanticReleasePubToken]).toEqual(googleIdToken);

    expect(getGoogleIdentityToken).toHaveBeenNthCalledWith(
      1,
      serviceAccount,
      PUB_DEV_URL,
    );
    expect(execa).toHaveBeenNthCalledWith(1, cli, [
      "pub",
      "token",
      "add",
      PUB_DEV_URL,
      `--env-var=${semanticReleasePubToken}`,
    ]);
    expect(execa).toHaveBeenNthCalledWith(2, cli, ["pub", "publish", "--force"], {
      cwd: ".",
    });
  });

  test("success with useGithubOidc=true", async () => {
    const config = { ...testConfig, useGithubOidc: true };
    vi.mocked(getConfig).mockReturnValue(config);

    const actual = await publish(config, context);

    expect(actual).toEqual({
      name: "pub.dev package",
      url: `${PUB_DEV_URL}/packages/${pubspec.name}/versions/${version}`,
    });
    expect(process.env[semanticReleasePubToken]).toEqual(githubIdToken);

    expect(getGithubIdentityToken).toHaveBeenNthCalledWith(1, PUB_DEV_URL);
    expect(execa).toHaveBeenNthCalledWith(1, cli, [
      "pub",
      "token",
      "add",
      PUB_DEV_URL,
      `--env-var=${semanticReleasePubToken}`,
    ]);
    expect(execa).toHaveBeenNthCalledWith(2, cli, ["pub", "publish", "--force"], {
      cwd: ".",
    });
  });

  test("success with pkgRoot publishes from pkgRoot directory", async () => {
    const pkgRoot = "packages/my_pkg";
    const config = { ...testConfig, pkgRoot };
    vi.mocked(getConfig).mockReturnValue(config);
    stubEnv();

    await publish(config, context);

    expect(getPubspec).toHaveBeenNthCalledWith(1, pkgRoot);
    expect(execa).toHaveBeenNthCalledWith(
      2,
      cli,
      ["pub", "publish", "--force"],
      { cwd: pkgRoot },
    );
  });

  test("success with custom registryUrl", async () => {
    const customUrl = "https://my-registry.example.com";
    const config = { ...testConfig, registryUrl: customUrl };
    vi.mocked(getConfig).mockReturnValue(config);
    stubEnv();

    const actual = await publish(config, context);

    expect(actual).toEqual({
      name: "pub.dev package",
      url: `${customUrl}/packages/${pubspec.name}/versions/${version}`,
    });
    expect(getGoogleIdentityToken).toHaveBeenNthCalledWith(
      1,
      serviceAccount,
      customUrl,
    );
    expect(execa).toHaveBeenNthCalledWith(1, cli, [
      "pub",
      "token",
      "add",
      customUrl,
      `--env-var=${semanticReleasePubToken}`,
    ]);
  });

  test("skip publish", async () => {
    const newConfig = { ...testConfig, publishPub: false };
    vi.mocked(getConfig).mockReturnValue(newConfig);

    const actual = await publish(newConfig, context);

    expect(actual).toBeUndefined();
    expect(getGoogleIdentityToken).toHaveBeenCalledTimes(0);
    expect(execa).toHaveBeenCalledTimes(0);
  });

  test("error due to missing environment variable", async () => {
    await expect(() => publish(testConfig, context)).rejects.toThrow(
      "Environment variable not found: GOOGLE_SERVICE_ACCOUNT_KEY",
    );

    expect(getGoogleIdentityToken).toHaveBeenCalledTimes(0);
    expect(execa).toHaveBeenCalledTimes(0);
  });

  const stubEnv = () =>
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", serviceAccount);
});
