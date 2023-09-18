import SemanticReleaseError from "@semantic-release/error";
import { codeBlock } from "common-tags";
import { execa } from "execa";
import { Credentials, JWT } from "google-auth-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { PluginConfig, verifyConditions } from "../src/index.js";

vi.mock("execa");
vi.mock("google-auth-library");

describe("verifyConditions", () => {
  const cli = "dart";
  const clientEmail = "clientEmail";
  const privateKey = "privateKey";
  const idToken = "idToken";
  const pubDevAudience = "https://pub.dev";

  const config: PluginConfig = { cli };
  const serviceAccount = codeBlock`
    {
      "client_email": "${clientEmail}",
      "private_key": "${privateKey}"
    }
  `;

  const creds = mock<Credentials>();

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("success", async () => {
    creds.id_token = idToken;
    const authorize = vi.fn().mockResolvedValue(creds);
    const jwtClient = mock<JWT>({ authorize });

    stubEnv();
    vi.mocked(JWT).mockReturnValue(jwtClient);

    await verifyConditions(config);

    expect(execa).toBeCalledWith(cli);
    expectJwtCalled();
    expect(authorize).toBeCalledTimes(1);
  });

  test("error due to missing environment variable", async () => {
    await expectSemanticReleaseError();

    expect(execa).toBeCalledTimes(0);
    expect(JWT).toBeCalledTimes(0);
  });

  test("error due to execa", async () => {
    stubEnv();
    vi.mocked(execa).mockImplementation(() => {
      throw new Error();
    });

    await expectSemanticReleaseError();

    expect(execa).toBeCalledWith(cli);
    expect(JWT).toBeCalledTimes(0);
  });

  test("error due to invalid service account", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", "clearlyInvalid");

    await expectSemanticReleaseError();

    expect(execa).toBeCalledWith(cli);
    expect(JWT).toBeCalledTimes(0);
  });

  test("error due to missing id token", async () => {
    creds.id_token = null;
    const authorize = vi.fn().mockResolvedValue(creds);
    const jwtClient = mock<JWT>({ authorize });

    stubEnv();
    vi.mocked(JWT).mockReturnValue(jwtClient);

    await expectSemanticReleaseError();

    expect(execa).toBeCalledWith(cli);
    expectJwtCalled();
    expect(authorize).toBeCalledTimes(1);
  });

  const stubEnv = () =>
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", serviceAccount);

  const expectJwtCalled = () => {
    expect(JWT).toHaveBeenNthCalledWith(
      1,
      clientEmail,
      undefined,
      privateKey,
      pubDevAudience,
    );
  };

  const expectSemanticReleaseError = async () => {
    await expect(() => verifyConditions(config)).rejects.toThrowError(
      SemanticReleaseError,
    );
  };
});
