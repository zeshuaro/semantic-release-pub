import { readFileSync, writeFileSync } from "fs";
import { PrepareContext } from "semantic-release";
import { parse } from "yaml";
import { Pubspec } from "./schemas.js";
import { PluginConfig } from "./types.js";
import { getConfig } from "./utils.js";

export const prepare = async (
  pluginConfig: PluginConfig,
  { nextRelease }: PrepareContext,
) => {
  const { pubspecPath } = getConfig(pluginConfig);

  const data = readFileSync(pubspecPath, "utf-8");
  const pubspec = Pubspec.parse(parse(data));

  const newData = data.replace(
    new RegExp(`^version:.*${pubspec.version}`),
    `version: ${nextRelease.version}`,
  );

  writeFileSync(pubspecPath, newData);
};
