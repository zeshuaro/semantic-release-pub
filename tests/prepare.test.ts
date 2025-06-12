import { readFileSync, writeFileSync } from "node:fs";
import { codeBlock } from "common-tags";
import type { NextRelease, PrepareContext } from "semantic-release";
import type { Signale } from "signale";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { type PluginConfig, prepare } from "../src/index.js";

vi.mock("fs");

describe("prepare", () => {
  const oldVersion = "1.2.0";
  const oldVersionSingleQuoted = "'1.2.0'";
  const oldVersionDoubleQuoted = '"1.2.0"';
  const oldVersionWithBuild = "1.2.0+1";
  const newVersion = "1.2.3";
  const versionPlaceholder = "__version__";
  const pubspecPath = "pubspec.yaml";
  const cli = "dart";

  const config: PluginConfig = {
    cli,
    publishPub: true,
    updateBuildNumber: false,
  };

  const basePubspec = codeBlock`
    name: pub_package
    version: ${versionPlaceholder}

    environment:
      sdk: ">=3.0.0 <4.0.0"

    dependencies:
      packageA: 1.0.0
      packageB:
        hosted: https://some-package-server.com
        version: 1.2.0
  `;

  const newPubspec = basePubspec.replace(
    new RegExp(versionPlaceholder),
    newVersion,
  );

  const nextRelease = mock<NextRelease>();
  const logger = mock<Signale>();
  const context = mock<PrepareContext>();

  beforeEach(() => {
    nextRelease.version = newVersion;
    context.logger = logger;
    context.nextRelease = nextRelease;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    oldVersion,
    oldVersionSingleQuoted,
    oldVersionDoubleQuoted,
    oldVersionWithBuild,
  ])("success with pubspec version %s", async (version) => {
    const pubspec = basePubspec.replace(
      new RegExp(versionPlaceholder),
      version,
    );
    vi.mocked(readFileSync).mockReturnValue(pubspec);

    await prepare(config, context);

    expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
    expect(writeFileSync).toHaveBeenNthCalledWith(1, pubspecPath, newPubspec);
  });

  test("success with pubspec version with build number (updateBuildNumber = true)", async () => {
    const newConfig = { ...config, updateBuildNumber: true };
    const pubspec = basePubspec.replace(
      new RegExp(versionPlaceholder),
      `${newVersion}+1`,
    );
    vi.mocked(readFileSync).mockReturnValue(pubspec);

    await prepare(newConfig, context);

    const newPubspec = basePubspec.replace(
      new RegExp(versionPlaceholder),
      `${newVersion}+2`,
    );

    expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
    expect(writeFileSync).toHaveBeenNthCalledWith(1, pubspecPath, newPubspec);
  });

  test("success with pubspec version without build number (updateBuildNumber = true)", async () => {
    const newConfig = { ...config, updateBuildNumber: true };
    const pubspec = basePubspec.replace(
      new RegExp(versionPlaceholder),
      `${newVersion}`,
    );
    vi.mocked(readFileSync).mockReturnValue(pubspec);

    await prepare(newConfig, context);

    const newPubspec = basePubspec.replace(
      new RegExp(versionPlaceholder),
      `${newVersion}+1`,
    );

    expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
    expect(writeFileSync).toHaveBeenNthCalledWith(1, pubspecPath, newPubspec);
  });

  test("error due to invalid build number", async () => {
    const newConfig = { ...config, updateBuildNumber: true };
    const pubspec = basePubspec.replace(
      new RegExp(versionPlaceholder),
      `${newVersion}+invalid`,
    );
    vi.mocked(readFileSync).mockReturnValue(pubspec);

    await expect(() => prepare(newConfig, context)).rejects.toThrowError(
      /Invalid build number/,
    );

    expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, "utf-8");
    expect(writeFileSync).toBeCalledTimes(0);
  });
});
