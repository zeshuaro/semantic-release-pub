import { readFileSync, writeFileSync } from 'fs';
import { PrepareContext } from 'semantic-release';
import { parse } from 'yaml';
import { Pubspec } from './schemas.js';

const PUBSPEC_PATH = 'pubspec.yaml';

export const prepare = async ({
  nextRelease: { version },
  logger
}: PrepareContext) => {
  const data = readFileSync(PUBSPEC_PATH, 'utf-8');
  const pubspec = Pubspec.parse(parse(data));

  const newData = data.replace(
    new RegExp(`version:[ \t]+${pubspec.version}`),
    `version: ${version}`
  );

  logger.log(`Writing version ${version} to ${PUBSPEC_PATH}`);
  writeFileSync(PUBSPEC_PATH, newData);
};
