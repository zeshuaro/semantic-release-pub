import { DEFAULT_CONFIG } from "./consts.js";
import { PluginConfig } from "./types.js";

export const getConfig = (config: PluginConfig): PluginConfig => {
  return { ...DEFAULT_CONFIG, ...config };
};
