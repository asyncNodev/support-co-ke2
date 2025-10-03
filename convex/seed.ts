import { internalMutation } from "./_generated/server";

export const runSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    // STEP 1: DELETE ALL OLD DATA
    console.log("Deleting all old data...");
    
    // Delete all quotations first (has foreign keys)
    const oldQuotations = await ctx.db.query("vendorQuotations").collect();
    for (const quot of oldQuotations) {
      await ctx.db.delete(quot._id);
    }
    
    const oldSentQuotations = await ctx.db.query("sentQuotations").collect();
    for (const sq of oldSentQuotations) {
      await ctx.db.delete(sq._id);
    }
    
    // Delete RFQ items
    const oldRfqItems = await ctx.db.query("rfqItems").collect();
    for (const item of oldRfqItems) {
      await ctx.db.delete(item._id);
    }
    
    // Delete RFQs
    const oldRfqs = await ctx.db.query("rfqs").collect();
    for (const rfq of oldRfqs) {
      await ctx.db.delete(rfq._id);
    }
    
    // Delete products
    const oldProducts = await ctx.db.query("products").collect();
    for (const product of oldProducts) {
      await ctx.db.delete(product._id);
    }
    
    // Delete categories
    const oldCategories = await ctx.db.query("categories").collect();
    for (const category of oldCategories) {
      await ctx.db.delete(category._id);
    }
    
    // Delete notifications
    const oldNotifications = await ctx.db.query("notifications").collect();
    for (const notif of oldNotifications) {
      await ctx.db.delete(notif._id);
    }
    
    // Delete ratings
    const oldRatings = await ctx.db.query("ratings").collect();
    for (const rating of oldRatings) {
      await ctx.db.delete(rating._id);
    }
    
    // Delete analytics
    const oldAnalytics = await ctx.db.query("analytics").collect();
    for (const analytic of oldAnalytics) {
      await ctx.db.delete(analytic._id);
    }
    
    // Delete scraping sources
    const oldScrapingSources = await ctx.db.query("scrapingSources").collect();
    for (const source of oldScrapingSources) {
      await ctx.db.delete(source._id);
    }
    
    console.log("✅ All old data deleted");

    // STEP 2: CREATE MEDICAL CATEGORIES
    const diagnosticEquipment = await ctx.db.insert("categories", {
      name: "Diagnostic Equipment",
      description: "Medical diagnostic devices and equipment",
      createdAt: Date.now(),
    });

    const patientCare = await ctx.db.insert("categories", {
      name: "Patient Care Equipment",
      description: "Equipment for patient care and mobility",
      createdAt: Date.now(),
    });

    const laboratoryEquipment = await ctx.db.insert("categories", {
      name: "Laboratory Equipment",
      description: "Laboratory testing and analysis equipment",
      createdAt: Date.now(),
    });

    const surgicalInstruments = await ctx.db.insert("categories", {
      name: "Surgical Instruments",
      description: "Surgical tools and instruments",
      createdAt: Date.now(),
    });

    const medicalDisposables = await ctx.db.insert("categories", {
      name: "Medical Disposables",
      description: "Single-use medical supplies",
      createdAt: Date.now(),
    });

    const hospitalFurniture = await ctx.db.insert("categories", {
      name: "Hospital Furniture",
      description: "Hospital beds, tables, and furniture",
      createdAt: Date.now(),
    });

    console.log("✅ Medical categories created");

    // STEP 3: CREATE MEDICAL PRODUCTS
    const products = [
      // Diagnostic Equipment
      { name: "Digital Blood Pressure Monitor", categoryId: diagnosticEquipment, description: "Automatic upper arm BP monitor with large LCD display", sku: "BP-100" },
      { name: "Pulse Oximeter", categoryId: diagnosticEquipment, description: "Fingertip pulse oximeter with OLED display", sku: "PO-200" },
      { name: "Digital Thermometer", categoryId: diagnosticEquipment, description: "Fast reading infrared thermometer", sku: "TH-300" },
      { name: "Stethoscope Dual Head", categoryId: diagnosticEquipment, description: "Professional cardiology stethoscope", sku: "ST-400" },
      { name: "Glucometer Kit", categoryId: diagnosticEquipment, description: "Blood glucose monitoring system with test strips", sku: "GL-500" },
      { name: "ECG Machine 12-Lead", categoryId: diagnosticEquipment, description: "Portable electrocardiograph machine", sku: "ECG-600" },
      { name: "Nebulizer Compressor", categoryId: diagnosticEquipment, description: "Medical nebulizer for respiratory treatment", sku: "NB-700" },
      
      // Patient Care Equipment
      { name: "Hospital Bed Electric", categoryId: patientCare, description: "3-function electric hospital bed with mattress", sku: "HB-800" },
      { name: "Wheelchair Standard", categoryId: patientCare, description: "Manual folding wheelchair with footrest", sku: "WC-900" },
      { name: "Walking Frame", categoryId: patientCare, description: "Adjustable aluminum walking aid", sku: "WF-1000" },
      { name: "Patient Monitor", categoryId: patientCare, description: "Multi-parameter patient monitoring system", sku: "PM-1100" },
      { name: "Oxygen Concentrator 5L", categoryId: patientCare, description: "Medical grade oxygen concentrator", sku: "OC-1200" },
      { name: "Suction Machine Portable", categoryId: patientCare, description: "Electric suction apparatus", sku: "SM-1300" },
      { name: "IV Stand Stainless Steel", categoryId: patientCare, description: "Height adjustable IV pole with wheels", sku: "IV-1400" },
      
      // Laboratory Equipment
      { name: "Microscope Binocular", categoryId: laboratoryEquipment, description: "LED illuminated laboratory microscope", sku: "MC-1500" },
      { name: "Centrifuge Laboratory", categoryId: laboratoryEquipment, description: "Benchtop centrifuge 4000 RPM", sku: "CF-1600" },
      { name: "Autoclave Sterilizer", categoryId: laboratoryEquipment, description: "Steam sterilizer 18L capacity", sku: "AC-1700" },
      { name: "Lab Incubator", categoryId: laboratoryEquipment, description: "Digital temperature controlled incubator", sku: "IN-1800" },
      { name: "Hemoglobin Meter", categoryId: laboratoryEquipment, description: "Portable hemoglobin analyzer", sku: "HM-1900" },
      { name: "Pipette Set", categoryId: laboratoryEquipment, description: "Variable volume micropipettes 3-piece set", sku: "PP-2000" },
      
      // Surgical Instruments
      { name: "Surgical Scissor Set", categoryId: surgicalInstruments, description: "Stainless steel surgical scissors 5-piece", sku: "SS-2100" },
      { name: "Forceps Set", categoryId: surgicalInstruments, description: "Surgical forceps assorted 10-piece", sku: "FC-2200" },
      { name: "Scalpel Handle Set", categoryId: surgicalInstruments, description: "Scalpel handles with disposable blades", sku: "SH-2300" },
      { name: "Surgical Blade Box", categoryId: surgicalInstruments, description: "Sterile surgical blades 100-pack", sku: "SB-2400" },
      { name: "Needle Holder", categoryId: surgicalInstruments, description: "Surgical needle holder 15cm", sku: "NH-2500" },
      
      // Medical Disposables
      { name: "Examination Gloves Box", categoryId: medicalDisposables, description: "Nitrile examination gloves 100-pack", sku: "GL-2600" },
      { name: "Surgical Face Masks Box", categoryId: medicalDisposables, description: "3-ply surgical masks 50-pack", sku: "FM-2700" },
      { name: "Syringes 10ml Pack", categoryId: medicalDisposables, description: "Disposable syringes with needles 100-pack", sku: "SY-2800" },
      { name: "Gauze Bandage Roll", categoryId: medicalDisposables, description: "Sterile gauze bandage 10cm x 4m", sku: "GB-2900" },
      { name: "Cotton Wool Roll", categoryId: medicalDisposables, description: "Absorbent cotton wool 500g", sku: "CW-3000" },
      { name: "Alcohol Swabs Box", categoryId: medicalDisposables, description: "Sterile alcohol prep pads 200-pack", sku: "AS-3100" },
      { name: "Urine Collection Bags", categoryId: medicalDisposables, description: "Sterile urine bags 2000ml 20-pack", sku: "UB-3200" },
      { name: "IV Cannula Set", categoryId: medicalDisposables, description: "IV catheter assorted sizes 50-pack", sku: "IC-3300" },
      
      // Hospital Furniture
      { name: "Medical Examination Table", categoryId: hospitalFurniture, description: "Adjustable examination couch with paper roll", sku: "ET-3400" },
      { name: "Bedside Cabinet", categoryId: hospitalFurniture, description: "Hospital bedside locker with drawer", sku: "BC-3500" },
      { name: "Medicine Trolley", categoryId: hospitalFurniture, description: "Stainless steel medicine cart 3-tier", sku: "MT-3600" },
      { name: "Overbed Table", categoryId: hospitalFurniture, description: "Height adjustable overbed table with wheels", sku: "OT-3700" },
      { name: "Instrument Trolley", categoryId: hospitalFurniture, description: "Stainless steel instrument trolley 2-tier", sku: "IT-3800" },
    ];

    const productIds = [];
    for (const product of products) {
      const id = await ctx.db.insert("products", {
        ...product,
        createdAt: Date.now(),
      });
      productIds.push(id);
    }

    console.log("✅ 40+ medical products created");

    // STEP 4: CREATE KENYAN MEDICAL VENDORS
    const vendors = [];
    
    const vendor1 = await ctx.db.insert("users", {
      authId: "demo-vendor-alphamed",
      email: "sales@alphamed.co.ke",
      name: "AlphaMed Supplies",
      role: "vendor",
      verified: true,
      companyName: "AlphaMed Kenya Ltd",
      phone: "+254 700 123 456",
      address: "Nairobi, Kenya",
      registeredAt: Date.now(),
    });
    vendors.push(vendor1);

    const vendor2 = await ctx.db.insert("users", {
      authId: "demo-vendor-mediplug",
      email: "info@mediplugequipment.co.ke",
      name: "Mediplug Equipment",
      role: "vendor",
      verified: true,
      companyName: "Mediplug Medical Equipment",
      phone: "+254 711 234 567",
      address: "Nairobi, Kenya",
      registeredAt: Date.now(),
    });
    vendors.push(vendor2);

    const vendor3 = await ctx.db.insert("users", {
      authId: "demo-vendor-enza",
      email: "sales@enzasupplies.co.ke",
      name: "Enza Medical Supplies",
      role: "vendor",
      verified: true,
      companyName: "Enza Supplies Ltd",
      phone: "+254 722 345 678",
      address: "Mombasa, Kenya",
      registeredAt: Date.now(),
    });
    vendors.push(vendor3);

    console.log("✅ Kenyan medical vendors created");

    // STEP 5: CREATE PRE-FILLED QUOTATIONS
    const basePrices = [
      4500, 3200, 1500, 8500, 4200, 125000, 6500, // Diagnostic
      85000, 12000, 3500, 95000, 75000, 18000, 2800, // Patient Care
      45000, 38000, 65000, 42000, 8500, 12000, // Laboratory
      5500, 8500, 3200, 2800, 4200, // Surgical
      1200, 800, 3500, 450, 650, 850, 1800, 2200, // Disposables
      35000, 8500, 22000, 6500, 15000, // Furniture
    ];

    let quotationCount = 0;
    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      const basePrice = basePrices[i];
      
      // Each product gets 2-3 quotations from different vendors
      const numQuotations = Math.floor(Math.random() * 2) + 2; // 2 or 3
      
      for (let j = 0; j < numQuotations; j++) {
        const vendorId = vendors[j % vendors.length];
        const priceVariation = 1 + (Math.random() * 0.3 - 0.15); // ±15%
        const price = Math.round(basePrice * priceVariation);
        
        await ctx.db.insert("vendorQuotations", {
          vendorId,
          productId,
          quotationType: "pre-filled",
          source: "auto-scraped",
          price,
          quantity: Math.floor(Math.random() * 50) + 10,
          paymentTerms: Math.random() > 0.5 ? "cash" : "credit",
          deliveryTime: `${Math.floor(Math.random() * 14) + 1} days`,
          warrantyPeriod: `${Math.floor(Math.random() * 12) + 6} months`,
          countryOfOrigin: ["Kenya", "China", "Germany", "USA", "India"][Math.floor(Math.random() * 5)],
          productSpecifications: "Medical grade, CE/ISO certified, meets international standards",
          active: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        quotationCount++;
      }
    }

    console.log(`✅ ${quotationCount} auto-scraped quotations created`);

    // STEP 6: ADD KENYAN MEDICAL WEBSITES FOR SCRAPING
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
        ...source,
        active: true,
        lastScraped: Date.now(),
        createdAt: Date.now(),
      });
    }

    console.log("✅ 7 Kenyan medical websites added");

    return {
      success: true,
      message: "Medical supplies data seeded successfully! All old data removed.",
      stats: {
        categories: 6,
        products: productIds.length,
        vendors: vendors.length,
        quotations: quotationCount,
        scrapingSources: scrapingSources.length,
      },
    };
  },
});