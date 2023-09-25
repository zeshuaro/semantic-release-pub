import { codeBlock } from 'common-tags';
import { readFileSync, writeFileSync } from 'fs';
import { NextRelease, PrepareContext } from 'semantic-release';
import { Signale } from 'signale';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { PluginConfig, prepare } from '../src/index.js';

vi.mock('fs');

describe('prepare', () => {
  const oldVersion = '1.2.0';
  const oldVersionWithBuild = '1.2.0+1';
  const newVersion = '1.2.3';
  const versionPlaceholder = '__version__';
  const pubspecPath = 'pubspec.yaml';
  const cli = 'dart';

  const config: PluginConfig = { cli, publishPub: true };

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
    newVersion
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

  test.each([oldVersion, oldVersionWithBuild])(
    'success with pubspec version %s',
    async (version) => {
      const pubspec = basePubspec.replace(
        new RegExp(versionPlaceholder),
        version
      );
      vi.mocked(readFileSync).mockReturnValue(pubspec);

      await prepare(config, context);

      expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, 'utf-8');
      expect(writeFileSync).toHaveBeenNthCalledWith(1, pubspecPath, newPubspec);
    }
  );
});
