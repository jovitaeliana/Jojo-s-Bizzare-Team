/**
 * Bootstrap script to create/publish a seller listing with id "product-1".
 * This allows the buyer agent's default flow to succeed.
 */

import dotenv from "dotenv";
import { sellingAgentService } from "../src/services/sellingAgent.js";

dotenv.config();

async function main() {
  try {
    const sellerAddress = process.env.SELLER_EVM_ADDRESS;
    if (!sellerAddress) {
      throw new Error("SELLER_EVM_ADDRESS not set in .env");
    }

    const listingId = "product-1";

    // Always recreate the listing to ensure correct data
    console.log(`Creating listing ${listingId}...`);
    const listing = await sellingAgentService.createListingWithId(
      listingId,
      'MacBook Pro 2021 14"',
      'Like-new MacBook Pro with M1 Pro chip, 16GB RAM, 512GB SSD',
      50,
      'HBAR',
      undefined,
      'like-new',
      'electronics'
    );

    // Mark as active and set seller address without requiring on-chain registration
    await sellingAgentService.updateListing(listingId, {
      status: 'active',
      sellerAddress,
    } as any);

    console.log(`✅ Listing ${listingId} is ready and active for seller ${sellerAddress}`);
  } catch (err: any) {
    console.error("❌ Bootstrap failed:", err.message);
    process.exit(1);
  }
}

main();

