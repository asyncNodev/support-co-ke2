"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

// Send WhatsApp message via Twilio
export const sendWhatsAppMessage = internalAction({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Only send if phone number is provided
    if (!args.to) {
      // console.log("No phone number provided, skipping WhatsApp message");
      return { success: false, error: "No phone number" };
    }

    // Format phone number (ensure it has country code)
    let phoneNumber = args.to.replace(/\s+/g, "");
    if (!phoneNumber.startsWith("+")) {
      // Add Kenya country code if not present
      phoneNumber = "+254" + phoneNumber.replace(/^0/, "");
    }

    try {
      // Using Twilio WhatsApp API
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., whatsapp:+14155238886

      if (!accountSid || !authToken || !fromNumber) {
        // console.log("Twilio credentials not configured, skipping WhatsApp message");
        return { success: false, error: "Twilio not configured" };
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: `whatsapp:${phoneNumber}`,
          Body: args.message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Twilio API error:", error);
        return { success: false, error };
      }

      const data = await response.json();
      // console.log("WhatsApp message sent successfully:", data.sid);
      return { success: true, messageSid: data.sid };
    } catch (error) {
      // console.error("Error sending WhatsApp message:", error);
      return { success: false, error: String(error) };
    }
  },
});

// Notify vendor about new RFQ
export const notifyVendorNewRFQ = internalAction({
  args: {
    vendorId: v.id("users"),
    rfqId: v.id("rfqs"),
    productNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const vendor = await ctx.runQuery(internal.users.getUserById, {
      userId: args.vendorId,
    });

    if (!vendor || !vendor.phone || !vendor.whatsappNotifications) {
      return;
    }

    const productList = args.productNames.join(", ");
    const message = `🏥 *New RFQ on supply.co.ke*

Products needed: ${productList}

Submit your quotation now to win this order!

View RFQ: https://supply.co.ke/vendor

- supply.co.ke Team`;

    await ctx.runAction(internal.whatsapp.sendWhatsAppMessage, {
      to: vendor.phone,
      message,
    });
  },
});

// Notify buyer about new quotation
export const notifyBuyerNewQuotation = internalAction({
  args: {
    buyerId: v.id("users"),
    rfqId: v.id("rfqs"),
    vendorName: v.string(),
    productName: v.string(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.runQuery(internal.users.getUserById, {
      userId: args.buyerId,
    });

    if (!buyer || !buyer.phone || !buyer.whatsappNotifications) {
      return;
    }

    const message = `💰 *New Quotation Received*

Product: ${args.productName}
Vendor: ${args.vendorName}
Price: KES ${args.price.toLocaleString()}

Compare prices and choose the best deal!

View quotations: https://supply.co.ke/buyer/rfq/${args.rfqId}

- supply.co.ke Team`;

    await ctx.runAction(internal.whatsapp.sendWhatsAppMessage, {
      to: buyer.phone,
      message,
    });
  },
});

// Notify vendor that their quotation was chosen
export const notifyVendorQuotationChosen = internalAction({
  args: {
    vendorId: v.id("users"),
    productName: v.string(),
    buyerName: v.string(),
    buyerPhone: v.string(),
    buyerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const vendor = await ctx.runQuery(internal.users.getUserById, {
      userId: args.vendorId,
    });

    if (!vendor || !vendor.phone || !vendor.whatsappNotifications) {
      return;
    }

    const message = `🎉 *Your Quotation Was Chosen!*

Congratulations! ${args.buyerName} selected your quotation for:
${args.productName}

*Buyer Contact:*
📱 Phone: ${args.buyerPhone}
📧 Email: ${args.buyerEmail}

Please contact them directly to finalize the order.

- supply.co.ke Team`;

    await ctx.runAction(internal.whatsapp.sendWhatsAppMessage, {
      to: vendor.phone,
      message,
    });
  },
});

// Notify admin about new registration
export const notifyAdminNewRegistration = internalAction({
  args: {
    userName: v.string(),
    userRole: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // Get admin phone numbers
    const admins = await ctx.runQuery(internal.users.getAdminUsers, {});

    for (const admin of admins) {
      if (!admin.phone || !admin.whatsappNotifications) {
        continue;
      }

      const message = `👤 *New User Registration*

Name: ${args.userName}
Role: ${args.userRole}
Email: ${args.userEmail}

Review and approve: https://supply.co.ke/admin

- supply.co.ke Team`;

      await ctx.runAction(internal.whatsapp.sendWhatsAppMessage, {
        to: admin.phone,
        message,
      });
    }
  },
});

// Notify buyer about group buying opportunity
export const notifyBuyerGroupBuying = internalAction({
  args: {
    buyerId: v.id("users"),
    productName: v.string(),
    hospitalCount: v.number(),
    potentialSavings: v.number(),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.runQuery(internal.users.getUserById, {
      userId: args.buyerId,
    });

    if (!buyer || !buyer.phone || !buyer.whatsappNotifications) {
      return;
    }

    const message = `🤝 *Group Buying Opportunity*

${args.hospitalCount} hospitals are buying: ${args.productName}

Join the group purchase and save up to KES ${args.potentialSavings.toLocaleString()}!

View opportunity: https://supply.co.ke/buyer

- supply.co.ke Team`;

    await ctx.runAction(internal.whatsapp.sendWhatsAppMessage, {
      to: buyer.phone,
      message,
    });
  },
});
