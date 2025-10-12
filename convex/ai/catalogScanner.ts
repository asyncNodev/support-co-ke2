"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import OpenAI from "openai";

export const scanCatalogImage = action({
  args: {
    imageUrl: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    products: Array<{
      name: string;
      description: string;
      category: string;
      specifications: string;
      price?: number;
      sku?: string;
      brand?: string;
      image?: string;
    }>;
  }> => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ConvexError({
        message: "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.",
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }

    try {
      const openai = new OpenAI({ apiKey });

      const prompt = `You are a medical equipment catalog scanner. Analyze this catalog page and extract ALL products visible.

For each product, provide:
- name: Full product name
- description: Detailed description (2-3 sentences)
- category: Medical equipment category (e.g., "Diagnostic Equipment", "Laboratory Equipment", "Surgical Instruments")
- specifications: Technical specifications and features
- price: Price if visible (number only, no currency)
- sku: Product code/SKU if visible
- brand: Brand/manufacturer if visible
- image: Set to "catalog" if product has an image

Return ONLY a valid JSON object with this structure:
{
  "products": [
    {
      "name": "Product Name",
      "description": "Description here",
      "category": "Category Name",
      "specifications": "Specs here",
      "price": 0,
      "sku": "SKU123",
      "brand": "Brand Name",
      "image": "catalog"
    }
  ]
}

Extract ALL products you can see. Be thorough. If a product doesn't have all fields, omit the missing ones.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: args.imageUrl, detail: "high" },
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new ConvexError({
          message: "No response from AI",
          code: "EXTERNAL_SERVICE_ERROR",
        });
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ConvexError({
          message: "Could not parse AI response. The image may not contain clear product information.",
          code: "EXTERNAL_SERVICE_ERROR",
        });
      }

      const result = JSON.parse(jsonMatch[0]);
      return result;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      console.error("OpenAI API error:", error);
      throw new ConvexError({
        message: `Failed to scan catalog: ${error instanceof Error ? error.message : "Unknown error"}`,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});
