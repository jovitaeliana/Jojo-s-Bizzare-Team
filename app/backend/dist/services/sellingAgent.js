import { erc8004Service } from './erc8004';
/**
 * Selling Agent Service
 * Handles listing creation, management, and sales transactions
 * Separate from the buying agent (x402) to provide specialized selling functionality
 */
export class SellingAgentService {
    listings = new Map();
    /**
     * Create a new listing
     */
    async createListing(title, description, price, currency, imageUrl, condition, category) {
        try {
            const listingId = `listing-${Date.now()}`;
            const listing = {
                id: listingId,
                title,
                description,
                price,
                currency,
                imageUrl,
                condition,
                category,
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.listings.set(listingId, listing);
            console.log('Listing created:', listingId);
            return listing;
        }
        catch (error) {
            console.error('Failed to create listing:', error);
            throw error;
        }
    }
    /**
     * Create a listing with a specific ID (utility for bootstrapping/tests)
     */
    async createListingWithId(listingId, title, description, price, currency, imageUrl, condition, category) {
        try {
            const listing = {
                id: listingId,
                title,
                description,
                price,
                currency,
                imageUrl,
                condition,
                category,
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.listings.set(listingId, listing);
            console.log('Listing created with fixed id:', listingId);
            return listing;
        }
        catch (error) {
            console.error('Failed to create listing with id:', error);
            throw error;
        }
    }
    /**
     * Publish listing to the marketplace
     */
    async publishListing(listingId, sellerAddress) {
        try {
            const listing = this.listings.get(listingId);
            if (!listing) {
                throw new Error('Listing not found');
            }
            // Register as an agent seller if not already registered
            await this.registerAsSeller(sellerAddress);
            // Update listing status
            listing.status = 'active';
            listing.sellerAddress = sellerAddress;
            listing.updatedAt = new Date();
            this.listings.set(listingId, listing);
            console.log('Listing published:', listingId);
            return true;
        }
        catch (error) {
            console.error('Failed to publish listing:', error);
            throw error;
        }
    }
    /**
     * Register seller as an AI agent in the marketplace
     */
    async registerAsSeller(address) {
        try {
            // Register with ERC-8004 agent registry
            await erc8004Service.registerAgent('User Seller Agent', address, [
                {
                    name: 'product-listing',
                    description: 'Sell products on the marketplace',
                    endpoint: '/api/sell',
                },
                {
                    name: 'instant-payment',
                    description: 'Accept Hedera payments via x402',
                    endpoint: '/api/payment',
                },
            ]);
            console.log('Seller registered:', address);
        }
        catch (error) {
            console.error('Seller registration failed:', error);
            throw error;
        }
    }
    /**
     * Update listing details
     */
    async updateListing(listingId, updates) {
        try {
            const listing = this.listings.get(listingId);
            if (!listing) {
                throw new Error('Listing not found');
            }
            const updatedListing = {
                ...listing,
                ...updates,
                updatedAt: new Date(),
            };
            this.listings.set(listingId, updatedListing);
            console.log('Listing updated:', listingId);
            return updatedListing;
        }
        catch (error) {
            console.error('Failed to update listing:', error);
            throw error;
        }
    }
    /**
     * Get listing by ID
     */
    getListing(listingId) {
        return this.listings.get(listingId);
    }
    /**
     * Get all active listings for a seller
     */
    getSellerListings(sellerAddress) {
        return Array.from(this.listings.values()).filter((listing) => listing.sellerAddress === sellerAddress);
    }
    /**
     * Get all active marketplace listings
     */
    getAllActiveListings() {
        return Array.from(this.listings.values()).filter((listing) => listing.status === 'active');
    }
    /**
     * Get all listings (for user's own listings page)
     */
    getAllListings() {
        return Array.from(this.listings.values());
    }
    /**
     * Mark listing as sold
     */
    async markAsSold(listingId, buyerAddress) {
        try {
            const listing = this.listings.get(listingId);
            if (!listing) {
                throw new Error('Listing not found');
            }
            listing.status = 'sold';
            listing.updatedAt = new Date();
            this.listings.set(listingId, listing);
            console.log('Listing marked as sold:', listingId);
            return true;
        }
        catch (error) {
            console.error('Failed to mark listing as sold:', error);
            return false;
        }
    }
    /**
     * Cancel/delist a listing
     */
    async cancelListing(listingId) {
        try {
            const listing = this.listings.get(listingId);
            if (!listing) {
                throw new Error('Listing not found');
            }
            listing.status = 'cancelled';
            listing.updatedAt = new Date();
            this.listings.set(listingId, listing);
            console.log('Listing cancelled:', listingId);
            return true;
        }
        catch (error) {
            console.error('Failed to cancel listing:', error);
            return false;
        }
    }
    /**
     * Handle incoming payment for a listing
     */
    async processListingSale(listingId, buyerAddress, transactionId) {
        try {
            const listing = this.listings.get(listingId);
            if (!listing) {
                return {
                    success: false,
                    message: 'Listing not found',
                };
            }
            if (listing.status !== 'active') {
                return {
                    success: false,
                    message: 'Listing is not available for purchase',
                };
            }
            // Mark as sold
            await this.markAsSold(listingId, buyerAddress);
            return {
                success: true,
                message: 'Sale completed successfully',
            };
        }
        catch (error) {
            console.error('Failed to process sale:', error);
            return {
                success: false,
                message: 'Failed to process sale',
            };
        }
    }
    /**
     * Generate listing recommendations based on user input
     */
    async generateListingRecommendations(userInput) {
        // Simple keyword-based recommendations
        // In production, this would use ML/AI for better suggestions
        const input = userInput.toLowerCase();
        let suggestedCategory = 'general';
        let basePriceEstimate = 100;
        if (input.includes('laptop') || input.includes('computer')) {
            suggestedCategory = 'electronics';
            basePriceEstimate = 500;
        }
        else if (input.includes('phone') || input.includes('mobile')) {
            suggestedCategory = 'electronics';
            basePriceEstimate = 300;
        }
        else if (input.includes('watch') || input.includes('smartwatch')) {
            suggestedCategory = 'electronics';
            basePriceEstimate = 250;
        }
        else if (input.includes('headphone') || input.includes('earbuds')) {
            suggestedCategory = 'electronics';
            basePriceEstimate = 150;
        }
        return {
            suggestedTitle: userInput,
            suggestedCategory,
            suggestedPrice: basePriceEstimate,
            tips: [
                'Include clear, high-quality photos of your item',
                'Provide detailed description of condition and features',
                'Price competitively based on market rates',
                'Respond quickly to buyer inquiries',
                'Use Hedera blockchain for secure, instant payments',
            ],
        };
    }
}
// Singleton instance
export const sellingAgentService = new SellingAgentService();
//# sourceMappingURL=sellingAgent.js.map