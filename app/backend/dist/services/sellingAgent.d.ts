import { Listing } from '../types';
/**
 * Selling Agent Service
 * Handles listing creation, management, and sales transactions
 * Separate from the buying agent (x402) to provide specialized selling functionality
 */
export declare class SellingAgentService {
    private listings;
    /**
     * Create a new listing
     */
    createListing(title: string, description: string, price: number, currency: string, imageUrl?: string, condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor', category?: string): Promise<Listing>;
    /**
     * Create a listing with a specific ID (utility for bootstrapping/tests)
     */
    createListingWithId(listingId: string, title: string, description: string, price: number, currency: string, imageUrl?: string, condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor', category?: string): Promise<Listing>;
    /**
     * Publish listing to the marketplace
     */
    publishListing(listingId: string, sellerAddress: string): Promise<boolean>;
    /**
     * Register seller as an AI agent in the marketplace
     */
    private registerAsSeller;
    /**
     * Update listing details
     */
    updateListing(listingId: string, updates: Partial<Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Listing>;
    /**
     * Get listing by ID
     */
    getListing(listingId: string): Listing | undefined;
    /**
     * Get all active listings for a seller
     */
    getSellerListings(sellerAddress: string): Listing[];
    /**
     * Get all active marketplace listings
     */
    getAllActiveListings(): Listing[];
    /**
     * Get all listings (for user's own listings page)
     */
    getAllListings(): Listing[];
    /**
     * Mark listing as sold
     */
    markAsSold(listingId: string, buyerAddress: string): Promise<boolean>;
    /**
     * Cancel/delist a listing
     */
    cancelListing(listingId: string): Promise<boolean>;
    /**
     * Handle incoming payment for a listing
     */
    processListingSale(listingId: string, buyerAddress: string, transactionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Generate listing recommendations based on user input
     */
    generateListingRecommendations(userInput: string): Promise<{
        suggestedTitle: string;
        suggestedCategory: string;
        suggestedPrice: number;
        tips: string[];
    }>;
}
export declare const sellingAgentService: SellingAgentService;
//# sourceMappingURL=sellingAgent.d.ts.map