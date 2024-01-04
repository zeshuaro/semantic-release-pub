import { readFileSync, writeFileSync } from "fs";
import { PrepareContext } from "semantic-release";
import { parse } from "yaml";
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
    const versionCodeString =
      pubspec.version.indexOf("+") >= 0 ? pubspec.version.split("+")[1] : "0";

    const versionCode = Number(versionCodeString);
    if (isNaN(versionCode)) {
      throw new Error(
        `Invalid version code: ${versionCodeString} in ${pubspec.version}`,
      );
    }

    nextVersion = `${version}+${versionCode + 1}`;
  }

  const newData = data.replace(
    new RegExp(`version:[ \t]+${pubspecVersionEscaped}`),
    `version: ${nextVersion}`,
  );

  logger.log(`Writing version ${version} to ${PUBSPEC_PATH}`);
  writeFileSync(PUBSPEC_PATH, newData);
};
