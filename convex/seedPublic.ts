import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const runSeed = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.seed.runSeed);
    return { message: "Seeding started..." };
  },
});