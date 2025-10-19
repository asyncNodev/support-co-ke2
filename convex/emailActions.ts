"use node";

import { v } from "convex/values";
import { Resend } from "resend";

import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailResponse {
  success: boolean;
}

export const sendVerificationEmail = action({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx: ActionCtx, args): Promise<SendEmailResponse> => {
    console.log("Sending verification email to:", args.email);
    await resend.emails.send({
      from: "supply.co.ke <noreply@supply.co.ke>",
      to: args.email,
      subject: "Verify your email",
      html: `
        <h1>Verify your email</h1>
        <p>Your verification code is: <strong>${args.code}</strong></p>
        <p>This code will expire in 15 minutes.</p>
      `,
    });

    return { success: true };
  },
});
