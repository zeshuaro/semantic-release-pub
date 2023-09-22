import { codeBlock } from 'common-tags';
import { readFileSync, writeFileSync } from 'fs';
import { NextRelease, PrepareContext } from 'semantic-release';
import { Signale } from 'signale';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { prepare } from '../src/index.js';

vi.mock('fs');

describe('prepare', () => {
  const newVersion = '1.2.3';
  const pubspecPath = 'pubspec.yaml';

  const oldPubspec = codeBlock`
    name: pub_package
    version: 1.2.0

    environment:
      sdk: ">=3.0.0 <4.0.0"

    dependencies:
      cupertino_icons: 1.0.6
  `;

  const newPubspec = codeBlock`
    name: pub_package
    version: ${newVersion}

    environment:
      sdk: ">=3.0.0 <4.0.0"

    dependencies:
      cupertino_icons: 1.0.6
  `;

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

  test('success', async () => {
    vi.mocked(readFileSync).mockReturnValue(oldPubspec);

    await prepare(context);

    expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, 'utf-8');
    expect(writeFileSync).toHaveBeenNthCalledWith(1, pubspecPath, newPubspec);
  });
});
