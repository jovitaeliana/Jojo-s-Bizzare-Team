/**
 * LLM Prompts for Seller Agent
 *
 * These prompts guide the seller agent's decision-making process
 * using Groq's LLM (llama-3.3-70b-versatile)
 */
export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    condition?: string;
    category?: string;
    sellerAddress?: string;
}
export interface BuyerOffer {
    buyerAgentId: string;
    buyerAddress?: string;
    offerPrice: number;
    currency: string;
    message: string;
    timestamp: string;
}
/**
 * Prompt for offer evaluation
 * Helps the seller agent decide whether to accept, reject, or counter an offer
 */
export declare function createOfferEvaluationPrompt(listing: Listing, offer: BuyerOffer): string;
/**
 * Prompt for counter-offer response evaluation
 * Helps the seller decide whether to accept buyer's response to counter-offer
 */
export declare function createCounterOfferResponsePrompt(listing: Listing, originalOffer: number, yourCounterOffer: number, buyerResponse: {
    accepted: boolean;
    newOffer?: number;
    message: string;
}): string;
/**
 * Prompt for shipment confirmation
 * Helps the seller agent compose a professional shipment confirmation message
 */
export declare function createShipmentConfirmationPrompt(listing: Listing, buyerAddress: string, trackingNumber?: string): string;
/**
 * Prompt for listing optimization
 * Helps the seller agent improve product listings
 */
export declare function createListingOptimizationPrompt(title: string, description: string, price: number, currency: string, condition?: string): string;
/**
 * Prompt for dispute resolution
 * Helps the seller agent handle buyer disputes professionally
 */
export declare function createDisputeResolutionPrompt(listing: Listing, disputeReason: string, buyerMessage: string): string;
//# sourceMappingURL=sellerPrompts.d.ts.map