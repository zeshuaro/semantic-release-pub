import { describe, expect, test } from "vitest";
import { PluginConfig } from "../src";
import { getConfig } from "../src/utils";

describe("getConfig", () => {
  const config: PluginConfig = { cli: "flutter", pubspecPath: "a/pubspec.yml" };

  test("success", () => {
    expect(getConfig(config)).toEqual(config);
  });
});
