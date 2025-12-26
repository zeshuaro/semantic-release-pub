import { writeFileSync } from "node:fs";
import SemanticReleaseError from "@semantic-release/error";
import type { PrepareContext } from "semantic-release";

import type { PluginConfig } from "./types.js";
import {
  getConfig,
  getPubspecFromString,
  getPubspecString,
  PUBSPEC_PATH,
} from "./utils.js";

export const prepare = async (
  pluginConfig: PluginConfig,
  { nextRelease: { version }, logger }: PrepareContext,
) => {
  const { updateBuildNumber } = getConfig(pluginConfig);

  const data = getPubspecString();
  const pubspec = getPubspecFromString(data);
  const pubspecVersionEscaped = pubspec.version.replace(
    /[/\-\\^$*+?.()|[\]{}]/g,
    "\\$&",
  );

  let nextVersion = version;
  if (updateBuildNumber) {
    const parts = pubspec.version.split("+");
    const buildNumber = parts.length > 1 ? Number(parts[1]) : 0;

    if (Number.isNaN(buildNumber)) {
      throw new SemanticReleaseError(
        `Invalid build number: ${buildNumber} in ${pubspec.version}`,
      );
    }

    nextVersion = `${version}+${buildNumber + 1}`;
  }

  const newData = data.replace(
    new RegExp(`version:[ \t]+['"]?${pubspecVersionEscaped}['"]?`),
    `version: ${nextVersion}`,
  );

  logger.log(`Writing version ${nextVersion} to ${PUBSPEC_PATH}`);
  writeFileSync(PUBSPEC_PATH, newData);
};
