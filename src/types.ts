export type PluginConfig = {
  cli: "dart" | "flutter";
  publishPub: boolean;
  updateBuildNumber: boolean;
  useGithubOidc: boolean;
  pkgRoot: string;
  registryUrl: string;
};
