// Minimal illustrative example (public)
export interface ReplayContext {
  replayId: string;
  riskLabel: 'INFO' | 'NOTICE' | 'RESTRICTED' | 'BLOCKED';
  getSignedUrl(): Promise<string>;
}

export type PluginInit = (ctx: ReplayContext) => void | Promise<void>;

// Example plugin: log risk label before playback
export const examplePlugin: PluginInit = async (ctx) => {
  // Do not expose secrets or internal thresholds here
  console.log(`[replay] ${ctx.replayId} label=${ctx.riskLabel}`);
  const url = await ctx.getSignedUrl();
  // attach to player (pseudo)
  // player.load(url)
};
