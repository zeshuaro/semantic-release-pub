import { readFileSync, writeFileSync } from "fs";
import SemanticReleaseError from "@semantic-release/error";
import { Context } from "semantic-release";
import { parse } from "yaml";
import { Pubspec } from "./schemas.js";
import { PluginConfig } from "./types.js";
import { getConfig } from "./utils.js";

export const prepare = async (
  pluginConfig: PluginConfig,
  { nextRelease }: Context,
) => {
  const { pubspecPath } = getConfig(pluginConfig);
  const version = nextRelease?.version;

  if (!version) {
    throw new SemanticReleaseError(
      "Could not determine version from semantic release",
    );
  }

  const data = readFileSync(pubspecPath, "utf-8");
  const pubspec = Pubspec.parse(parse(data));
  const newData = data.replace(
    new RegExp(`^version:.*${pubspec.version}`),
    `version: ${version}`,
  );
  writeFileSync(pubspecPath, newData);
};
