import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDemoData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingCategories = await ctx.db.query("categories").first();
    if (existingCategories) {
      console.log("Demo data already exists, skipping seed");
      return { message: "Demo data already exists" };
    }

    // Create Categories
    const electronicsId = await ctx.db.insert("categories", {
      name: "Electronics",
      description: "Electronic devices and components",
      icon: "Laptop",
      createdAt: Date.now(),
    });

    const furnitureId = await ctx.db.insert("categories", {
      name: "Office Furniture",
      description: "Office chairs, desks, and storage solutions",
      icon: "Armchair",
      createdAt: Date.now(),
    });

    const industrialId = await ctx.db.insert("categories", {
      name: "Industrial Equipment",
      description: "Machinery and industrial tools",
      icon: "Wrench",
      createdAt: Date.now(),
    });

    const suppliesId = await ctx.db.insert("categories", {
      name: "Office Supplies",
      description: "Paper, pens, and office essentials",
      icon: "Package",
      createdAt: Date.now(),
    });

    // Create Admin User
    const adminId = await ctx.db.insert("users", {
      authId: "admin-demo-001",
      email: "admin@quickquote.com",
      name: "Admin User",
      role: "admin",
      verified: true,
      companyName: "QuickQuote B2B",
      registeredAt: Date.now(),
    });

    // Create Vendor Users
    const vendor1Id = await ctx.db.insert("users", {
      authId: "vendor-demo-001",
      email: "vendor1@techsupply.com",
      name: "Tech Supply Co",
      role: "vendor",
      verified: true,
      companyName: "Tech Supply Co",
      phone: "+1-555-0101",
      address: "123 Tech Street, San Francisco, CA",
      registeredAt: Date.now(),
    });

    const vendor2Id = await ctx.db.insert("users", {
      authId: "vendor-demo-002",
      email: "vendor2@officepro.com",
      name: "Office Pro Solutions",
      role: "vendor",
      verified: true,
      companyName: "Office Pro Solutions",
      phone: "+1-555-0102",
      address: "456 Office Ave, New York, NY",
      registeredAt: Date.now(),
    });

    const vendor3Id = await ctx.db.insert("users", {
      authId: "vendor-demo-003",
      email: "vendor3@industrialmax.com",
      name: "Industrial Max",
      role: "vendor",
      verified: true,
      companyName: "Industrial Max",
      phone: "+1-555-0103",
      address: "789 Industrial Blvd, Chicago, IL",
      registeredAt: Date.now(),
    });

    const vendor4Id = await ctx.db.insert("users", {
      authId: "vendor-demo-004",
      email: "vendor4@unverified.com",
      name: "New Vendor (Unverified)",
      role: "vendor",
      verified: false,
      companyName: "New Vendor Inc",
      phone: "+1-555-0104",
      address: "321 New Street, Boston, MA",
      registeredAt: Date.now(),
    });

    // Create Buyer Users
    const buyer1Id = await ctx.db.insert("users", {
      authId: "buyer-demo-001",
      email: "buyer1@construction.com",
      name: "John Construction",
      role: "buyer",
      verified: true,
      companyName: "ABC Construction Ltd",
      phone: "+1-555-0201",
      address: "111 Builder Lane, Austin, TX",
      registeredAt: Date.now(),
    });

    const buyer2Id = await ctx.db.insert("users", {
      authId: "buyer-demo-002",
      email: "buyer2@retailcorp.com",
      name: "Sarah Retail",
      role: "buyer",
      verified: true,
      companyName: "Retail Corp International",
      phone: "+1-555-0202",
      address: "222 Shop Street, Seattle, WA",
      registeredAt: Date.now(),
    });

    // Create Products - Electronics
    const laptop1Id = await ctx.db.insert("products", {
      name: "Business Laptop Pro 15",
      categoryId: electronicsId,
      description: "High-performance laptop for business professionals with 16GB RAM, 512GB SSD",
      sku: "LAPTOP-PRO-15",
      specifications: "Intel i7, 16GB RAM, 512GB SSD, 15.6\" Display",
      createdAt: Date.now(),
    });

    const monitor1Id = await ctx.db.insert("products", {
      name: "4K Monitor 27 inch",
      categoryId: electronicsId,
      description: "Ultra HD 4K monitor perfect for design work and presentations",
      sku: "MON-4K-27",
      specifications: "27\" 4K UHD, IPS Panel, USB-C, HDMI",
      createdAt: Date.now(),
    });

    const printer1Id = await ctx.db.insert("products", {
      name: "Laser Printer Multi-Function",
      categoryId: electronicsId,
      description: "All-in-one printer with print, scan, copy, fax capabilities",
      sku: "PRINT-LASER-MF",
      specifications: "40ppm, Duplex, Network Ready, ADF",
      createdAt: Date.now(),
    });

    // Create Products - Office Furniture
    const chair1Id = await ctx.db.insert("products", {
      name: "Ergonomic Office Chair",
      categoryId: furnitureId,
      description: "Comfortable ergonomic chair with lumbar support and adjustable height",
      sku: "CHAIR-ERGO-01",
      specifications: "Mesh back, adjustable armrests, 360° swivel",
      createdAt: Date.now(),
    });

    const desk1Id = await ctx.db.insert("products", {
      name: "Standing Desk Adjustable",
      categoryId: furnitureId,
      description: "Electric height-adjustable desk for healthy working",
      sku: "DESK-STAND-01",
      specifications: "60\" x 30\", Electric motor, Memory presets",
      createdAt: Date.now(),
    });

    const cabinet1Id = await ctx.db.insert("products", {
      name: "Filing Cabinet 4-Drawer",
      categoryId: furnitureId,
      description: "Heavy-duty steel filing cabinet with lock",
      sku: "CAB-FILE-4D",
      specifications: "Steel construction, Letter/Legal size, Lockable",
      createdAt: Date.now(),
    });

    // Create Products - Industrial Equipment
    const drill1Id = await ctx.db.insert("products", {
      name: "Industrial Drill Press",
      categoryId: industrialId,
      description: "Heavy-duty drill press for industrial applications",
      sku: "DRILL-IND-01",
      specifications: "1HP motor, 12 speed settings, 16\" swing",
      createdAt: Date.now(),
    });

    const generator1Id = await ctx.db.insert("products", {
      name: "Portable Generator 5000W",
      categoryId: industrialId,
      description: "Reliable portable generator for backup power",
      sku: "GEN-PORT-5K",
      specifications: "5000W, Gas powered, Electric start",
      createdAt: Date.now(),
    });

    // Create Products - Office Supplies
    const paper1Id = await ctx.db.insert("products", {
      name: "A4 Printer Paper (Carton)",
      categoryId: suppliesId,
      description: "High-quality A4 paper, 80gsm, 2500 sheets per carton",
      sku: "PAPER-A4-CTN",
      specifications: "80gsm, 5 reams x 500 sheets, White",
      createdAt: Date.now(),
    });

    const pens1Id = await ctx.db.insert("products", {
      name: "Ballpoint Pens Box (50 pcs)",
      categoryId: suppliesId,
      description: "Professional ballpoint pens in blue ink",
      sku: "PEN-BALL-50",
      specifications: "Medium point, Blue ink, 50 pack",
      createdAt: Date.now(),
    });

    // Create Vendor Quotations - Vendor 1 (Tech Supply Co)
    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor1Id,
      productId: laptop1Id,
      price: 899,
      quantity: 100,
      paymentTerms: "credit",
      deliveryTime: "5-7 business days",
      warrantyPeriod: "2 years",
      productDescription: "Brand new, factory sealed. Includes free shipping for orders over 10 units.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor1Id,
      productId: monitor1Id,
      price: 349,
      quantity: 200,
      paymentTerms: "credit",
      deliveryTime: "3-5 business days",
      warrantyPeriod: "3 years",
      productDescription: "Latest model with USB-C connectivity. Volume discounts available.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor1Id,
      productId: printer1Id,
      price: 599,
      quantity: 50,
      paymentTerms: "cash",
      deliveryTime: "7-10 business days",
      warrantyPeriod: "1 year",
      productDescription: "Professional grade with high-capacity toner included.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create Vendor Quotations - Vendor 2 (Office Pro Solutions)
    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: laptop1Id,
      price: 929,
      quantity: 80,
      paymentTerms: "credit",
      deliveryTime: "3-5 business days",
      warrantyPeriod: "3 years",
      productDescription: "Premium extended warranty included. Setup service available.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: chair1Id,
      price: 249,
      quantity: 150,
      paymentTerms: "credit",
      deliveryTime: "5-7 business days",
      warrantyPeriod: "5 years",
      productDescription: "Ergonomically certified. Free assembly for bulk orders.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: desk1Id,
      price: 549,
      quantity: 100,
      paymentTerms: "credit",
      deliveryTime: "7-10 business days",
      warrantyPeriod: "5 years",
      productDescription: "Premium quality with smooth operation. Installation included.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: cabinet1Id,
      price: 189,
      quantity: 200,
      paymentTerms: "cash",
      deliveryTime: "5-7 business days",
      warrantyPeriod: "2 years",
      productDescription: "Heavy-duty construction. Bulk discounts available.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: paper1Id,
      price: 35,
      quantity: 500,
      paymentTerms: "cash",
      deliveryTime: "2-3 business days",
      warrantyPeriod: "N/A",
      productDescription: "High-quality paper. Fast delivery available.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: pens1Id,
      price: 12,
      quantity: 1000,
      paymentTerms: "cash",
      deliveryTime: "2-3 business days",
      warrantyPeriod: "N/A",
      productDescription: "Smooth writing. Various colors available.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create Vendor Quotations - Vendor 3 (Industrial Max)
    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor3Id,
      productId: drill1Id,
      price: 1299,
      quantity: 30,
      paymentTerms: "credit",
      deliveryTime: "10-14 business days",
      warrantyPeriod: "3 years",
      productDescription: "Industrial grade with comprehensive warranty. Training included.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor3Id,
      productId: generator1Id,
      price: 799,
      quantity: 50,
      paymentTerms: "credit",
      deliveryTime: "7-10 business days",
      warrantyPeriod: "2 years",
      productDescription: "Reliable power solution. Maintenance service available.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor3Id,
      productId: monitor1Id,
      price: 329,
      quantity: 100,
      paymentTerms: "cash",
      deliveryTime: "5-7 business days",
      warrantyPeriod: "2 years",
      productDescription: "Competitive pricing. Quick delivery.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create some analytics data
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Site visitors over the last 7 days
    for (let i = 0; i < 7; i++) {
      const count = Math.floor(Math.random() * 50) + 20;
      for (let j = 0; j < count; j++) {
        await ctx.db.insert("analytics", {
          type: "visitor",
          timestamp: now - i * oneDay - Math.random() * oneDay,
        });
      }
    }

    // Some RFQ analytics
    for (let i = 0; i < 15; i++) {
      await ctx.db.insert("analytics", {
        type: "rfq_sent",
        metadata: `buyer${i % 2 + 1}`,
        timestamp: now - Math.random() * 7 * oneDay,
      });
    }

    // Some quotation analytics
    for (let i = 0; i < 30; i++) {
      await ctx.db.insert("analytics", {
        type: "quotation_sent",
        metadata: `vendor${(i % 3) + 1}`,
        timestamp: now - Math.random() * 7 * oneDay,
      });
    }

    console.log("Demo data seeded successfully!");
    return {
      message: "Demo data created successfully",
      counts: {
        categories: 4,
        products: 10,
        users: 6,
        vendors: 4,
        buyers: 2,
        quotations: 13,
      },
    };
  },
});
