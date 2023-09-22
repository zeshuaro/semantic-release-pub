import { codeBlock } from 'common-tags';
import { readFileSync, writeFileSync } from 'fs';
import { NextRelease, PrepareContext } from 'semantic-release';
import { afterEach, describe, expect, test, vi } from 'vitest';
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('success', async () => {
    const nextRelease = mock<NextRelease>();
    nextRelease.version = newVersion;

    const context = mock<PrepareContext>();
    context.nextRelease = nextRelease;

    vi.mocked(readFileSync).mockReturnValue(oldPubspec);

    await prepare(context);

    expect(readFileSync).toHaveBeenNthCalledWith(1, pubspecPath, 'utf-8');
    expect(writeFileSync).toHaveBeenNthCalledWith(1, pubspecPath, newPubspec);
  });
});
