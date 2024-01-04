import { readFileSync, writeFileSync } from "fs";
import { parse } from "yaml";
import { PrepareContext } from "semantic-release";
import SemanticReleaseError from "@semantic-release/error";

import { Pubspec } from "./schemas.js";
import { PluginConfig } from "./types.js";
import { getConfig } from "./utils.js";

const PUBSPEC_PATH = "pubspec.yaml";

export const prepare = async (
  pluginConfig: PluginConfig,
  { nextRelease: { version }, logger }: PrepareContext,
) => {
  const { updateBuildNumber } = getConfig(pluginConfig);

  const data = readFileSync(PUBSPEC_PATH, "utf-8");
  const pubspec = Pubspec.parse(parse(data));
  const pubspecVersionEscaped = pubspec.version.replace(
    /[/\-\\^$*+?.()|[\]{}]/g,
    "\\$&",
  );

  let nextVersion = version;
  if (updateBuildNumber) {
    const parts = pubspec.version.split("+");
    const buildNumber = parts.length > 1 ? Number(parts[1]) : 0;

    if (isNaN(buildNumber)) {
      throw new SemanticReleaseError(
        `Invalid build number: ${buildNumber} in ${pubspec.version}`,
      );
    }

    nextVersion = `${version}+${buildNumber + 1}`;
  }

  const newData = data.replace(
    new RegExp(`version:[ \t]+${pubspecVersionEscaped}`),
    `version: ${nextVersion}`,
  );

  logger.log(`Writing version ${version} to ${PUBSPEC_PATH}`);
  writeFileSync(PUBSPEC_PATH, newData);
};
