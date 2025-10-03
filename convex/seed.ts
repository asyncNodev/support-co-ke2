import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const runSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear all existing data
    const existingProducts = await ctx.db.query("products").collect();
    for (const product of existingProducts) {
      await ctx.db.delete(product._id);
    }

    const existingCategories = await ctx.db.query("categories").collect();
    for (const category of existingCategories) {
      await ctx.db.delete(category._id);
    }

    const existingQuotations = await ctx.db.query("vendorQuotations").collect();
    for (const quotation of existingQuotations) {
      await ctx.db.delete(quotation._id);
    }

    const existingRFQs = await ctx.db.query("rfqs").collect();
    for (const rfq of existingRFQs) {
      await ctx.db.delete(rfq._id);
    }

    const existingSentQuotations = await ctx.db.query("sentQuotations").collect();
    for (const sent of existingSentQuotations) {
      await ctx.db.delete(sent._id);
    }

    // Create Medical Supplies Categories
    const diagnosticEquipmentCat = await ctx.db.insert("categories", {
      name: "Diagnostic Equipment",
      description: "Medical diagnostic devices and equipment",
      createdAt: Date.now(),
    });

    const patientCareCat = await ctx.db.insert("categories", {
      name: "Patient Care Equipment",
      description: "Hospital beds, wheelchairs, and patient care items",
      createdAt: Date.now(),
    });

    const laboratoryEquipmentCat = await ctx.db.insert("categories", {
      name: "Laboratory Equipment",
      description: "Lab testing and analysis equipment",
      createdAt: Date.now(),
    });

    const surgicalInstrumentsCat = await ctx.db.insert("categories", {
      name: "Surgical Instruments",
      description: "Surgical tools and instruments",
      createdAt: Date.now(),
    });

    const disposablesCat = await ctx.db.insert("categories", {
      name: "Medical Disposables",
      description: "Single-use medical supplies and consumables",
      createdAt: Date.now(),
    });

    const hospitalFurnitureCat = await ctx.db.insert("categories", {
      name: "Hospital Furniture",
      description: "Medical furniture and fixtures",
      createdAt: Date.now(),
    });

    // Create Medical Products with realistic Kenyan prices
    const products = [
      // Diagnostic Equipment
      { name: "Digital Blood Pressure Monitor", categoryId: diagnosticEquipmentCat, price: 4500, description: "Automatic digital BP monitor with LCD display" },
      { name: "Pulse Oximeter", categoryId: diagnosticEquipmentCat, price: 3200, description: "Fingertip pulse oximeter with OLED display" },
      { name: "Digital Thermometer", categoryId: diagnosticEquipmentCat, price: 800, description: "Fast-reading digital thermometer" },
      { name: "Stethoscope Professional", categoryId: diagnosticEquipmentCat, price: 6500, description: "Dual-head stethoscope for adults and pediatrics" },
      { name: "Glucometer with Strips", categoryId: diagnosticEquipmentCat, price: 2500, description: "Blood glucose monitoring system" },
      { name: "ECG Machine 3-Channel", categoryId: diagnosticEquipmentCat, price: 95000, description: "Portable electrocardiograph machine" },
      { name: "Ultrasound Scanner Portable", categoryId: diagnosticEquipmentCat, price: 450000, description: "Portable ultrasound imaging system" },
      
      // Patient Care Equipment
      { name: "Hospital Bed Electric", categoryId: patientCareCat, price: 85000, description: "Three-function electric hospital bed" },
      { name: "Wheelchair Standard", categoryId: patientCareCat, price: 12000, description: "Foldable wheelchair with footrests" },
      { name: "Patient Monitor Multi-Parameter", categoryId: patientCareCat, price: 180000, description: "Vital signs monitoring system" },
      { name: "IV Stand Stainless Steel", categoryId: patientCareCat, price: 4500, description: "Height-adjustable IV drip stand" },
      { name: "Oxygen Concentrator 5L", categoryId: patientCareCat, price: 75000, description: "Medical oxygen concentrator machine" },
      { name: "Nebulizer Machine", categoryId: patientCareCat, price: 5500, description: "Compressor nebulizer for respiratory therapy" },
      { name: "Suction Machine Portable", categoryId: patientCareCat, price: 18000, description: "Electric suction apparatus" },
      
      // Laboratory Equipment
      { name: "Microscope Binocular", categoryId: laboratoryEquipmentCat, price: 45000, description: "Laboratory microscope 40-1000x magnification" },
      { name: "Centrifuge Machine", categoryId: laboratoryEquipmentCat, price: 65000, description: "Lab centrifuge 4000 RPM" },
      { name: "Autoclave Sterilizer", categoryId: laboratoryEquipmentCat, price: 95000, description: "Steam sterilizer autoclave 18L" },
      { name: "Lab Incubator", categoryId: laboratoryEquipmentCat, price: 85000, description: "Digital temperature-controlled incubator" },
      { name: "Hot Air Oven", categoryId: laboratoryEquipmentCat, price: 55000, description: "Dry heat sterilizer" },
      { name: "Water Bath Digital", categoryId: laboratoryEquipmentCat, price: 32000, description: "Laboratory water bath with digital control" },
      
      // Surgical Instruments
      { name: "Surgical Scissors Set", categoryId: surgicalInstrumentsCat, price: 8500, description: "Stainless steel surgical scissors set of 5" },
      { name: "Forceps Set Surgical", categoryId: surgicalInstrumentsCat, price: 12000, description: "Assorted surgical forceps pack" },
      { name: "Scalpel Handles Set", categoryId: surgicalInstrumentsCat, price: 4500, description: "Surgical scalpel handles with blades" },
      { name: "Suture Kit Complete", categoryId: surgicalInstrumentsCat, price: 15000, description: "Complete suturing kit with needles" },
      { name: "Surgical Blade Sterile Box", categoryId: surgicalInstrumentsCat, price: 2500, description: "Box of 100 sterile surgical blades" },
      
      // Medical Disposables
      { name: "Examination Gloves Latex Box", categoryId: disposablesCat, price: 1200, description: "Box of 100 latex examination gloves" },
      { name: "Surgical Face Masks Box", categoryId: disposablesCat, price: 800, description: "Box of 50 3-ply surgical masks" },
      { name: "Syringes Disposable 5ml Box", categoryId: disposablesCat, price: 650, description: "Pack of 100 disposable syringes" },
      { name: "IV Cannula Set", categoryId: disposablesCat, price: 450, description: "Set of 10 IV cannulas with wings" },
      { name: "Gauze Bandages Roll", categoryId: disposablesCat, price: 180, description: "Medical gauze bandage roll 5cm x 5m" },
      { name: "Cotton Wool Roll", categoryId: disposablesCat, price: 350, description: "Medical cotton wool 500g roll" },
      { name: "Surgical Gloves Sterile Box", categoryId: disposablesCat, price: 2800, description: "Box of 50 pairs sterile surgical gloves" },
      { name: "Alcohol Swabs Box", categoryId: disposablesCat, price: 450, description: "Box of 100 alcohol prep pads" },
      
      // Hospital Furniture
      { name: "Medical Examination Table", categoryId: hospitalFurnitureCat, price: 35000, description: "Adjustable examination couch" },
      { name: "Medicine Trolley Stainless", categoryId: hospitalFurnitureCat, price: 28000, description: "Three-tier medicine trolley" },
      { name: "Bedside Locker Cabinet", categoryId: hospitalFurnitureCat, price: 12000, description: "Hospital bedside cabinet" },
      { name: "Instrument Cabinet Glass", categoryId: hospitalFurnitureCat, price: 45000, description: "Stainless steel instrument storage" },
      { name: "Over-Bed Table", categoryId: hospitalFurnitureCat, price: 8500, description: "Height-adjustable over-bed table" },
    ];

    const productIds = [];
    for (const product of products) {
      const id = await ctx.db.insert("products", {
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        sku: `MED-${Math.floor(Math.random() * 10000)}`,
        specifications: product.description,
        createdAt: Date.now(),
      });
      productIds.push({ id, price: product.price, name: product.name });
    }

    // Get or create vendors
    const vendors = await ctx.db.query("users")
      .withIndex("by_role", (q) => q.eq("role", "vendor"))
      .filter((q) => q.eq(q.field("verified"), true))
      .collect();

    if (vendors.length === 0) {
      console.log("No verified vendors found. Creating sample vendors...");
      
      // Create sample vendors
      const vendor1 = await ctx.db.insert("users", {
        authId: "vendor_alphamed",
        email: "vendor@alphamed.co.ke",
        name: "AlphaMed Supplies",
        role: "vendor",
        verified: true,
        companyName: "AlphaMed Kenya Ltd",
        phone: "+254 700 123456",
        address: "Nairobi, Kenya",
        registeredAt: Date.now(),
      });

      const vendor2 = await ctx.db.insert("users", {
        authId: "vendor_mediplug",
        email: "vendor@mediplugequipment.co.ke",
        name: "Mediplug Equipment",
        role: "vendor",
        verified: true,
        companyName: "Mediplug Equipment Ltd",
        phone: "+254 701 234567",
        address: "Nairobi, Kenya",
        registeredAt: Date.now(),
      });

      const vendor3 = await ctx.db.insert("users", {
        authId: "vendor_enza",
        email: "vendor@enzasupplies.co.ke",
        name: "Enza Medical Supplies",
        role: "vendor",
        verified: true,
        companyName: "Enza Supplies Kenya",
        phone: "+254 702 345678",
        address: "Mombasa, Kenya",
        registeredAt: Date.now(),
      });

      const v1 = await ctx.db.get(vendor1);
      const v2 = await ctx.db.get(vendor2);
      const v3 = await ctx.db.get(vendor3);
      
      if (v1) vendors.push(v1);
      if (v2) vendors.push(v2);
      if (v3) vendors.push(v3);
    }

    // Create pre-filled quotations from vendors (scraped data simulation)
    const paymentTerms = ["cash", "credit"] as const;
    const countries = ["Kenya", "China", "Germany", "USA", "India"];
    
    for (const productInfo of productIds) {
      // Each product gets 2-3 vendor quotations
      const numVendors = Math.floor(Math.random() * 2) + 2;
      const shuffledVendors = [...vendors].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(numVendors, shuffledVendors.length); i++) {
        const vendor = shuffledVendors[i];
        if (!vendor) continue;
        
        const priceVariation = 0.85 + Math.random() * 0.3; // 85% to 115% of base price
        const price = Math.round(productInfo.price * priceVariation);
        
        await ctx.db.insert("vendorQuotations", {
          vendorId: vendor._id,
          productId: productInfo.id,
          quotationType: "pre-filled",
          source: "auto-scraped",
          price,
          quantity: Math.floor(Math.random() * 50) + 10,
          paymentTerms: paymentTerms[Math.floor(Math.random() * 2)],
          deliveryTime: `${Math.floor(Math.random() * 7) + 1}-${Math.floor(Math.random() * 7) + 7} days`,
          warrantyPeriod: `${Math.floor(Math.random() * 12) + 6} months`,
          countryOfOrigin: countries[Math.floor(Math.random() * countries.length)],
          productSpecifications: `Medical grade ${productInfo.name}. ISO certified. CE marked.`,
          productDescription: `High quality ${productInfo.name} from verified supplier. Meets international medical standards.`,
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Add scraping sources
    const scrapingSources = [
      { name: "AlphaMed Kenya", url: "https://alphamed.co.ke/", country: "Kenya" },
      { name: "Mediplug Equipment", url: "https://mediplugequipment.co.ke/", country: "Kenya" },
      { name: "Enza Supplies", url: "https://enzasupplies.co.ke/", country: "Kenya" },
      { name: "Apical Medical", url: "https://www.apicalmed.com/", country: "Kenya" },
      { name: "Medipal Medical Supplies", url: "https://medipalmedicalsupplies.co.ke/", country: "Kenya" },
      { name: "Medical Equipment Supplies Kenya", url: "https://www.medicalequipmentsupplieskenya.com/", country: "Kenya" },
      { name: "Crown Healthcare Kenya", url: "https://www.crownkenya.com/", country: "Kenya" },
    ];

    for (const source of scrapingSources) {
      await ctx.db.insert("scrapingSources", {
        name: source.name,
        url: source.url,
        country: source.country,
        active: true,
        lastScraped: Date.now(),
        createdAt: Date.now(),
      });
    }

    return {
      message: "Medical supplies data seeded successfully!",
      productsCreated: productIds.length,
      vendorsCount: vendors.length,
      scrapingSourcesAdded: scrapingSources.length,
    };
  },
});