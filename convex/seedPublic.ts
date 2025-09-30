import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const runSeed = mutation({
  args: {},
  handler: async (ctx) => {
    // Call the internal seed mutation
    const result = await ctx.scheduler.runAfter(0, internal.seed.seedDemoData);
    return { success: true, message: "Seed job scheduled" };
  },
});
