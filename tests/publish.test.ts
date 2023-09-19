import { execa } from "execa";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PluginConfig, publish } from "../src/index.js";
import { getConfig, getGoogleIdentityToken } from "../src/utils.js";

vi.mock("execa");
vi.mock("../src/utils");

describe("publish", () => {
  const cli = "dart";
  const pubspecPath = "pubspecPath";
  const serviceAccount = "serviceAccount";
  const idToken = "idToken";
  const semanticReleasePubToken = "SEMANTIC_RELEASE_PUB_TOKEN";

  const config: PluginConfig = { cli, pubspecPath };

  beforeEach(() => {
    vi.mocked(getConfig).mockReturnValue(config);
    vi.mocked(getGoogleIdentityToken).mockResolvedValue(idToken);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("success", async () => {
    stubEnv();

    await publish(config);

    expect(process.env[semanticReleasePubToken]).toEqual(idToken);
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

  const stubEnv = () =>
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", serviceAccount);
});
