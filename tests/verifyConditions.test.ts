import SemanticReleaseError from "@semantic-release/error";
import { execa } from "execa";
import type { VerifyConditionsContext } from "semantic-release";
import type { Signale } from "signale";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { type PluginConfig, verifyConditions } from "../src/index.js";
import {
  getConfig,
  getGithubIdentityToken,
  getGoogleIdentityToken,
  PUB_DEV_URL,
} from "../src/utils.js";

vi.mock("execa");
vi.mock("google-auth-library");
vi.mock("../src/utils");

describe("verifyConditions", () => {
  const cli = "dart";
  const serviceAccount = "serviceAccount";
  const idToken = "idToken";
  const customUrl = "https://my-registry.example.com";

  const testConfig: PluginConfig = {
    cli,
    publishPub: true,
    updateBuildNumber: false,
    useGithubOidc: false,
    registryUrl: PUB_DEV_URL,
  };

  const logger = mock<Signale>();
  const context = mock<VerifyConditionsContext>();

  beforeEach(() => {
    context.logger = logger;

    vi.mocked(getConfig).mockReturnValue(testConfig);
    vi.mocked(getGoogleIdentityToken).mockResolvedValue(idToken);
    vi.mocked(getGithubIdentityToken).mockResolvedValue(idToken);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  test("success", async () => {
    stubEnv();

    await verifyConditions(testConfig, context);

    expect(execa).toHaveBeenCalledWith(cli);
    expectGetGoogleIdentityTokenCalled(PUB_DEV_URL);
  });

  test("success with custom registryUrl", async () => {
    const config = { ...testConfig, registryUrl: customUrl };
    vi.mocked(getConfig).mockReturnValue(config);
    stubEnv();

    await verifyConditions(config, context);

    expect(execa).toHaveBeenCalledWith(cli);
    expectGetGoogleIdentityTokenCalled(customUrl);
  });

  test("success with publishPub=false", async () => {
    const config = { ...testConfig, publishPub: false };
    vi.mocked(getConfig).mockReturnValue(config);

    await verifyConditions(config, context);

    expect(getGoogleIdentityToken).toHaveBeenCalledTimes(0);
    expect(execa).toHaveBeenCalledTimes(0);
  });

  test("success with useGithubOidc=true", async () => {
    const config = { ...testConfig, useGithubOidc: true };
    vi.mocked(getConfig).mockReturnValue(config);

    await verifyConditions(config, context);

    expect(getGithubIdentityToken).toHaveBeenNthCalledWith(1, PUB_DEV_URL);
    expect(getGoogleIdentityToken).toHaveBeenCalledTimes(0);
    expect(execa).toHaveBeenCalledWith(cli);
  });

  test("error due to missing environment variable", async () => {
    await expectSemanticReleaseError();

    expect(execa).toHaveBeenCalledTimes(0);
    expect(getGoogleIdentityToken).toHaveBeenCalledTimes(0);
  });

  test("error due to actions/core getIDToken", async () => {
    const config = { ...testConfig, useGithubOidc: true };
    vi.mocked(getConfig).mockReturnValue(config);
    vi.mocked(getGithubIdentityToken).mockImplementation(() => {
      throw new Error();
    });

    await expectSemanticReleaseError(config);

    expect(execa).toHaveBeenCalledTimes(0);
    expect(getGoogleIdentityToken).toHaveBeenCalledTimes(0);
  });

  test("error due to execa", async () => {
    stubEnv();
    vi.mocked(execa).mockImplementation(() => {
      throw new Error();
    });

    await expectSemanticReleaseError();

    expect(execa).toHaveBeenCalledWith(cli);
    expectGetGoogleIdentityTokenCalled(PUB_DEV_URL);
  });

  const stubEnv = () =>
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", serviceAccount);

  const expectGetGoogleIdentityTokenCalled = (registryUrl: string) =>
    expect(getGoogleIdentityToken).toHaveBeenNthCalledWith(
      1,
      serviceAccount,
      registryUrl,
    );

  const expectSemanticReleaseError = async (
    config: PluginConfig = testConfig,
  ) => {
    await expect(() => verifyConditions(config, context)).rejects.toThrow(
      SemanticReleaseError,
    );
  };
});
