import { readFileSync, writeFileSync } from "fs";
import SemanticReleaseError from "@semantic-release/error";
import { codeBlock } from "common-tags";
import { Context, NextRelease } from "semantic-release";
import { afterEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { PluginConfig, prepare } from "../src/index.js";

vi.mock("fs");

describe("prepare", () => {
  const cli = "dart";
  const newVersion = "1.2.3";
  const pubspecPath = "pubspecPath";
  const oldPubspec = codeBlock`
    version: 1.2.0

    environment:
      sdk: ">=3.0.0 <4.0.0"

    dependencies:
      cupertino_icons: 1.0.6
  `;
  const newPubspec = codeBlock`
    version: ${newVersion}

    environment:
      sdk: ">=3.0.0 <4.0.0"

    dependencies:
      cupertino_icons: 1.0.6
  `;

  const config: PluginConfig = { cli, pubspecPath };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("success", async () => {
    const nextRelease = mock<NextRelease>();
    nextRelease.version = newVersion;

    const context = mock<Context>();
    context.nextRelease = nextRelease;

    vi.mocked(readFileSync).mockReturnValue(oldPubspec);

    await prepare(config, context);

    expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
    expect(writeFileSync).toHaveBeenNthCalledWith(1, pubspecPath, newPubspec);
  });

  test("error due to missing version", async () => {
    const context = mock<Context>();

    await expect(() => prepare(config, context)).rejects.toThrowError(
      SemanticReleaseError,
    );

    expect(readFileSync).toBeCalledTimes(0);
    expect(writeFileSync).toBeCalledTimes(0);
  });
});
