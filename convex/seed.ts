import { internalMutation } from "./_generated/server";

export const runSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingCategories = await ctx.db.query("categories").collect();
    if (existingCategories.length > 0) {
      return { message: "Data already seeded" };
    }

    // Create Categories
    const electronicsId = await ctx.db.insert("categories", {
      name: "Electronics",
      description: "Computers, laptops, and electronic devices",
      createdAt: Date.now(),
    });

    const furnitureId = await ctx.db.insert("categories", {
      name: "Office Furniture",
      description: "Desks, chairs, and office furniture",
      createdAt: Date.now(),
    });

    const equipmentId = await ctx.db.insert("categories", {
      name: "Industrial Equipment",
      description: "Heavy machinery and industrial tools",
      createdAt: Date.now(),
    });

    const suppliesId = await ctx.db.insert("categories", {
      name: "Office Supplies",
      description: "Paper, pens, and office supplies",
      createdAt: Date.now(),
    });

    // Create Products
    const laptop1Id = await ctx.db.insert("products", {
      name: "Business Laptop Pro 15",
      categoryId: electronicsId,
      description: "High-performance laptop for business professionals",
      sku: "LAP-BP15-001",
      specifications: "Intel i7, 16GB RAM, 512GB SSD, 15.6'' Display",
      createdAt: Date.now(),
    });

    const monitor1Id = await ctx.db.insert("products", {
      name: "Professional Monitor 27''",
      categoryId: electronicsId,
      description: "4K Ultra HD monitor with color accuracy",
      sku: "MON-P27-001",
      specifications: "27'', 4K UHD, IPS Panel, USB-C",
      createdAt: Date.now(),
    });

    const printer1Id = await ctx.db.insert("products", {
      name: "Office Laser Printer",
      categoryId: electronicsId,
      description: "High-speed laser printer for office use",
      sku: "PRT-OLP-001",
      specifications: "40ppm, Duplex, Network, 250-sheet tray",
      createdAt: Date.now(),
    });

    const chair1Id = await ctx.db.insert("products", {
      name: "Ergonomic Office Chair",
      categoryId: furnitureId,
      description: "Premium ergonomic chair with lumbar support",
      sku: "CHR-ERG-001",
      specifications: "Adjustable height, lumbar support, breathable mesh",
      createdAt: Date.now(),
    });

    const desk1Id = await ctx.db.insert("products", {
      name: "Standing Desk Electric",
      categoryId: furnitureId,
      description: "Height-adjustable standing desk",
      sku: "DSK-STD-001",
      specifications: "Electric motor, memory presets, 120x60cm",
      createdAt: Date.now(),
    });

    const cabinet1Id = await ctx.db.insert("products", {
      name: "Filing Cabinet 4-Drawer",
      categoryId: furnitureId,
      description: "Secure metal filing cabinet",
      sku: "CAB-FIL-001",
      specifications: "4 drawers, locking, letter/legal size",
      createdAt: Date.now(),
    });

    const drill1Id = await ctx.db.insert("products", {
      name: "Industrial Power Drill",
      categoryId: equipmentId,
      description: "Heavy-duty cordless drill",
      sku: "DRL-IND-001",
      specifications: "18V, 2Ah battery, 13mm chuck, 2-speed",
      createdAt: Date.now(),
    });

    const generator1Id = await ctx.db.insert("products", {
      name: "Portable Generator 5000W",
      categoryId: equipmentId,
      description: "Gasoline generator for job sites",
      sku: "GEN-PRT-001",
      specifications: "5000W, 4-stroke engine, 4 outlets",
      createdAt: Date.now(),
    });

    const paper1Id = await ctx.db.insert("products", {
      name: "Copy Paper A4 - 5 Reams",
      categoryId: suppliesId,
      description: "Premium white copy paper",
      sku: "PPR-A4-001",
      specifications: "80gsm, 500 sheets per ream, 5 reams",
      createdAt: Date.now(),
    });

    const pens1Id = await ctx.db.insert("products", {
      name: "Ballpoint Pens Box - 50pcs",
      categoryId: suppliesId,
      description: "Professional ballpoint pens",
      sku: "PEN-BP-001",
      specifications: "Medium tip, blue ink, box of 50",
      createdAt: Date.now(),
    });

    // Create Admin User
    const adminId = await ctx.db.insert("users", {
      authId: "admin@quickquote.com",
      email: "admin@quickquote.com",
      name: "Admin User",
      role: "admin",
      verified: true,
      companyName: "QuickQuote B2B",
      registeredAt: Date.now(),
    });

    // Create Verified Vendors
    const vendor1Id = await ctx.db.insert("users", {
      authId: "vendor1@techsupply.com",
      email: "vendor1@techsupply.com",
      name: "John Smith",
      role: "vendor",
      verified: true,
      companyName: "Tech Supply Co.",
      phone: "+1-555-0101",
      address: "123 Tech Street, San Francisco, CA",
      registeredAt: Date.now(),
    });

    const vendor2Id = await ctx.db.insert("users", {
      authId: "vendor2@officepro.com",
      email: "vendor2@officepro.com",
      name: "Sarah Johnson",
      role: "vendor",
      verified: true,
      companyName: "Office Pro Solutions",
      phone: "+1-555-0102",
      address: "456 Business Ave, New York, NY",
      registeredAt: Date.now(),
    });

    const vendor3Id = await ctx.db.insert("users", {
      authId: "vendor3@industrial.com",
      email: "vendor3@industrial.com",
      name: "Mike Davis",
      role: "vendor",
      verified: true,
      companyName: "Industrial Equipment Inc.",
      phone: "+1-555-0103",
      address: "789 Factory Rd, Chicago, IL",
      registeredAt: Date.now(),
    });

    // Create Unverified Vendor (pending approval)
    const vendor4Id = await ctx.db.insert("users", {
      authId: "vendor4@newvendor.com",
      email: "vendor4@newvendor.com",
      name: "Lisa Brown",
      role: "vendor",
      verified: false,
      companyName: "New Vendor Corp",
      phone: "+1-555-0104",
      address: "321 Startup Lane, Austin, TX",
      registeredAt: Date.now(),
    });

    // Create Buyers
    const buyer1Id = await ctx.db.insert("users", {
      authId: "buyer1@company.com",
      email: "buyer1@company.com",
      name: "Robert Wilson",
      role: "buyer",
      verified: true,
      companyName: "Wilson Enterprises",
      phone: "+1-555-0201",
      address: "100 Corporate Blvd, Boston, MA",
      registeredAt: Date.now(),
    });

    const buyer2Id = await ctx.db.insert("users", {
      authId: "buyer2@business.com",
      email: "buyer2@business.com",
      name: "Emily Chen",
      role: "buyer",
      verified: true,
      companyName: "Chen Business Group",
      phone: "+1-555-0202",
      address: "200 Trade Center, Seattle, WA",
      registeredAt: Date.now(),
    });

    // Create Vendor Quotations - Vendor 1 (Tech Supply Co.)
    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor1Id,
      productId: laptop1Id,
      quotationType: "pre-filled",
      source: "manual",
      price: 899,
      quantity: 100,
      paymentTerms: "cash",
      deliveryTime: "3-5 business days",
      warrantyPeriod: "2 years",
      countryOfOrigin: "Taiwan",
      productSpecifications: "Intel Core i7-1260P, 16GB DDR4 RAM, 512GB NVMe SSD, 15.6'' FHD IPS Display, Windows 11 Pro",
      productDescription: "Premium business laptop with high performance and reliability.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor1Id,
      productId: monitor1Id,
      quotationType: "pre-filled",
      source: "manual",
      price: 449,
      quantity: 75,
      paymentTerms: "credit",
      deliveryTime: "5-7 business days",
      warrantyPeriod: "3 years",
      countryOfOrigin: "South Korea",
      productSpecifications: "27'' 4K UHD (3840x2160), IPS Panel, 99% sRGB, USB-C with 65W Power Delivery, HDMI 2.0, DisplayPort 1.4",
      productDescription: "Professional-grade monitor with excellent color accuracy for design work.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor1Id,
      productId: printer1Id,
      quotationType: "pre-filled",
      source: "manual",
      price: 599,
      quantity: 50,
      paymentTerms: "cash",
      deliveryTime: "7-10 business days",
      warrantyPeriod: "1 year",
      countryOfOrigin: "Japan",
      productSpecifications: "Monochrome Laser, 40ppm, Automatic Duplex, Network-ready, 250-sheet input tray, 100-sheet output tray",
      productDescription: "Professional grade printer with high-capacity toner included.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create Vendor Quotations - Vendor 2 (Office Pro Solutions)
    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: laptop1Id,
      quotationType: "pre-filled",
      source: "manual",
      price: 929,
      quantity: 80,
      paymentTerms: "credit",
      deliveryTime: "2-3 business days",
      warrantyPeriod: "3 years",
      countryOfOrigin: "Taiwan",
      productSpecifications: "Intel Core i7-1260P, 16GB DDR5 RAM, 512GB NVMe SSD, 15.6'' FHD IPS Display, Windows 11 Pro, Backlit Keyboard",
      productDescription: "Enhanced business laptop with extended warranty and faster delivery.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: chair1Id,
      quotationType: "pre-filled",
      source: "auto-scraped",
      price: 349,
      quantity: 120,
      paymentTerms: "cash",
      deliveryTime: "1-2 weeks",
      warrantyPeriod: "5 years",
      countryOfOrigin: "USA",
      productSpecifications: "Adjustable height (45-55cm), Full lumbar support, Breathable mesh back, 360° swivel, Weight capacity 150kg",
      productDescription: "Ergonomically designed chair to reduce back pain and improve posture. Scraped from vendor website.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: desk1Id,
      quotationType: "pre-filled",
      source: "manual",
      price: 599,
      quantity: 50,
      paymentTerms: "credit",
      deliveryTime: "2-3 weeks",
      warrantyPeriod: "7 years",
      countryOfOrigin: "Germany",
      productSpecifications: "Electric height adjustment (70-120cm), 4 memory presets, Desktop size 120x60cm, Load capacity 80kg, Anti-collision",
      productDescription: "Premium electric standing desk with German engineering quality.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor2Id,
      productId: paper1Id,
      quotationType: "pre-filled",
      source: "auto-scraped",
      price: 24.99,
      quantity: 500,
      paymentTerms: "cash",
      deliveryTime: "3-5 business days",
      warrantyPeriod: "No warranty",
      countryOfOrigin: "Canada",
      productSpecifications: "A4 size (210x297mm), 80gsm weight, 500 sheets per ream, 5 reams per box, 96% brightness, FSC certified",
      productDescription: "Premium white copy paper suitable for all printers and copiers.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create Vendor Quotations - Vendor 3 (Industrial Equipment Inc.)
    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor3Id,
      productId: drill1Id,
      quotationType: "pre-filled",
      source: "manual",
      price: 189,
      quantity: 200,
      paymentTerms: "cash",
      deliveryTime: "1 week",
      warrantyPeriod: "2 years",
      countryOfOrigin: "USA",
      productSpecifications: "18V Lithium-ion, 2.0Ah battery, 13mm keyless chuck, 2-speed gearbox (0-450/0-1500 RPM), LED work light",
      productDescription: "Heavy-duty cordless drill perfect for construction and industrial use.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor3Id,
      productId: generator1Id,
      quotationType: "pre-filled",
      source: "manual",
      price: 799,
      quantity: 40,
      paymentTerms: "credit",
      deliveryTime: "2-3 weeks",
      warrantyPeriod: "1 year",
      countryOfOrigin: "China",
      productSpecifications: "5000W continuous / 5500W peak, 4-stroke OHV engine, 4 AC outlets (120V), 8-hour runtime at 50% load, Recoil start",
      productDescription: "Reliable portable generator for job sites and emergency backup power.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor3Id,
      productId: cabinet1Id,
      quotationType: "pre-filled",
      source: "auto-scraped",
      price: 299,
      quantity: 60,
      paymentTerms: "cash",
      deliveryTime: "1-2 weeks",
      warrantyPeriod: "10 years",
      countryOfOrigin: "USA",
      productSpecifications: "4 drawers, Steel construction, Central locking system, Ball-bearing slides, Letter/Legal size compatible, Dimensions: 52x46x132cm",
      productDescription: "Durable metal filing cabinet with high security locking system.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor3Id,
      productId: pens1Id,
      quotationType: "pre-filled",
      source: "manual",
      price: 12.99,
      quantity: 1000,
      paymentTerms: "cash",
      deliveryTime: "5-7 business days",
      warrantyPeriod: "No warranty",
      countryOfOrigin: "China",
      productSpecifications: "Medium tip (1.0mm), Blue oil-based ink, Transparent barrel, Non-slip grip, Box of 50 pens",
      productDescription: "Reliable ballpoint pens for everyday office use.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vendorQuotations", {
      vendorId: vendor3Id,
      productId: monitor1Id,
      quotationType: "pre-filled",
      source: "auto-scraped",
      price: 479,
      quantity: 50,
      paymentTerms: "credit",
      deliveryTime: "1 week",
      warrantyPeriod: "3 years",
      countryOfOrigin: "South Korea",
      productSpecifications: "27'' 4K UHD (3840x2160), IPS Panel, 95% DCI-P3, USB-C 90W PD, HDMI 2.1, DisplayPort 1.4, Height adjustable stand",
      productDescription: "Professional monitor with wide color gamut for creative professionals.",
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create sample analytics data
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 7; i++) {
      // Daily visitors
      await ctx.db.insert("analytics", {
        type: "visitor",
        timestamp: now - i * oneDayMs,
      });

      // RFQs sent
      if (i % 2 === 0) {
        await ctx.db.insert("analytics", {
          type: "rfq_sent",
          timestamp: now - i * oneDayMs,
        });
      }

      // Quotations sent
      await ctx.db.insert("analytics", {
        type: "quotation_sent",
        timestamp: now - i * oneDayMs,
      });
    }

    return { message: "Demo data seeded successfully!" };
  },
});
