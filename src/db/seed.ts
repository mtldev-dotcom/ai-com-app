/**
 * Database seed script
 * Populates the database with demo data for testing
 *
 * Run with: npm run db:seed
 */
import * as dotenv from "dotenv";
import { db } from "./index";
import { suppliers, productsDraft, variantsDraft, imports } from "./schema";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data (in development only)
    console.log("Clearing existing data...");
    await db.delete(variantsDraft);
    await db.delete(productsDraft);
    await db.delete(imports);
    await db.delete(suppliers);

    // Seed Suppliers
    console.log("Creating suppliers...");
    const [supplier1, supplier2] = await db
      .insert(suppliers)
      .values([
        {
          name: "TechSupplier Pro",
          contactEmail: "contact@techsupplier.pro",
          contactPhone: "+1-555-0101",
          website: "https://techsupplier.pro",
          notes: "High-quality tech products, fast shipping",
          qualityRating: "4.5",
          speedRating: "4.8",
          priceRating: "4.2",
          supportRating: "4.6",
          averageRating: "4.53",
        },
        {
          name: "Global Electronics Inc",
          contactEmail: "sales@globalelectronics.com",
          contactPhone: "+1-555-0102",
          website: "https://globalelectronics.com",
          notes: "Competitive pricing, good product range",
          qualityRating: "4.0",
          speedRating: "3.8",
          priceRating: "4.5",
          supportRating: "4.0",
          averageRating: "4.08",
        },
      ])
      .returning();

    console.log(`✅ Created ${supplier1.name} and ${supplier2.name}`);

    // Seed Product Drafts
    console.log("Creating product drafts...");
    const [product1, product2, product3] = await db
      .insert(productsDraft)
      .values([
        {
          supplierId: supplier1.id,
          titleFr: "Casque Audio Premium Bluetooth",
          titleEn: "Premium Bluetooth Audio Headset",
          descriptionFr:
            "Casque audio sans fil haute qualité avec réduction de bruit active. Batterie 30h, micro intégré, compatible tous appareils.",
          descriptionEn:
            "High-quality wireless headset with active noise cancellation. 30h battery, built-in microphone, compatible with all devices.",
          metaTitle: "Casque Audio Premium | Nick a Deal",
          metaDescription:
            "Découvrez notre casque audio premium avec réduction de bruit active et 30h d'autonomie.",
          images: [
            "https://example.com/images/headset-1.jpg",
            "https://example.com/images/headset-2.jpg",
          ],
          cost: "45.00",
          sellingPrice: "89.99",
          margin: "49.94",
          specifications: {
            battery: "30 hours",
            connectivity: "Bluetooth 5.2",
            weight: "250g",
            color: "Black",
          },
          status: "draft",
        },
        {
          supplierId: supplier1.id,
          titleFr: "Smartwatch Fitness Pro",
          titleEn: "Fitness Pro Smartwatch",
          descriptionFr:
            "Montre intelligente avec suivi fitness complet, GPS, moniteur cardiaque, étanche IP68.",
          descriptionEn:
            "Smartwatch with complete fitness tracking, GPS, heart rate monitor, IP68 waterproof.",
          metaTitle: "Smartwatch Fitness Pro | Nick a Deal",
          metaDescription:
            "Smartwatch avec GPS et suivi fitness complet, étanche IP68.",
          images: ["https://example.com/images/smartwatch-1.jpg"],
          cost: "120.00",
          sellingPrice: "199.99",
          margin: "39.99",
          specifications: {
            display: "1.4 inch AMOLED",
            battery: "7 days",
            sensors: "GPS, Heart Rate, Accelerometer",
            waterResistance: "IP68",
          },
          status: "enriched",
        },
        {
          supplierId: supplier2.id,
          titleFr: "Chargeur Sans Fil Rapide",
          titleEn: "Fast Wireless Charger",
          descriptionFr:
            "Chargeur sans fil 15W, charge rapide compatible Qi. Design compact et portable.",
          descriptionEn:
            "15W wireless charger, fast charging Qi compatible. Compact and portable design.",
          metaTitle: "Chargeur Sans Fil 15W | Nick a Deal",
          metaDescription:
            "Chargeur sans fil rapide 15W, compatible tous appareils Qi.",
          images: ["https://example.com/images/charger-1.jpg"],
          cost: "15.00",
          sellingPrice: "29.99",
          margin: "49.85",
          specifications: {
            power: "15W",
            compatibility: "Qi Standard",
            dimensions: "10cm x 10cm",
          },
          status: "ready",
        },
      ])
      .returning();

    console.log(
      `✅ Created ${product1.titleEn}, ${product2.titleEn}, ${product3.titleEn}`
    );

    // Seed Variants Draft
    console.log("Creating variant drafts...");
    const [variant1, variant2, variant3] = await db
      .insert(variantsDraft)
      .values([
        {
          productDraftId: product1.id,
          name: "Color: Black",
          sku: "HS-BLK-001",
          priceAdjustment: "0.00",
          stock: 50,
        },
        {
          productDraftId: product1.id,
          name: "Color: White",
          sku: "HS-WHT-001",
          priceAdjustment: "5.00",
          stock: 30,
        },
        {
          productDraftId: product2.id,
          name: "Size: 42mm",
          sku: "SW-42-001",
          priceAdjustment: "0.00",
          stock: 25,
        },
      ])
      .returning();

    console.log(
      `✅ Created variants: ${variant1.name}, ${variant2.name}, ${variant3.name}`
    );

    // Seed Import Records
    console.log("Creating import records...");
    const [import1] = await db
      .insert(imports)
      .values([
        {
          sourceType: "csv",
          filename: "products_import_2024.csv",
          mappedColumns: {
            title: "title_en",
            price: "cost",
            description: "description_en",
            image: "images",
          },
          status: "completed",
          totalRows: 15,
          processedRows: 15,
          failedRows: 0,
        },
      ])
      .returning();

    console.log(`✅ Created import record: ${import1.filename}`);

    console.log("✨ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log("Seed script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed script failed:", error);
      process.exit(1);
    });
}

export default seed;
