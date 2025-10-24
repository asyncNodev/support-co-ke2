import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Get user notifications
export const getMyNotifications = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new ConvexError({
        message: "Notification not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.notificationId, { read: true });

    return null;
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const notification of notifications) {
      if (!notification.read) {
        await ctx.db.patch(notification._id, { read: true });
      }
    }

    return null;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    // if (!identity) {
    //   return 0;
    // }

    // const user = await ctx.db
    //   .query("users")
    //   .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
    //   .first();

    if (!user) {
      return 0;
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return notifications.filter((n) => !n.read).length;
  },
});

// Send admin contact message (from chatbot)
export const sendAdminContactMessage = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    productRequest: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all admin users
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    // Send notification to all admins
    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "rfq_received",
        title: "Product Request from Chatbot",
        message: `${args.name} (${args.email}, ${args.phone}) is looking for: ${args.productRequest}`,
        read: false,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});
