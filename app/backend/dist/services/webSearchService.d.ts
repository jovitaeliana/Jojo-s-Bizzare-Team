import { Product } from '../types';
declare class WebSearchService {
    private readonly googleApiKey;
    private readonly googleCseId;
    private readonly serpApiKey;
    private readonly defaultSearchParams;
    constructor();
    /**
     * Search for products on the internet using various search APIs
     */
    searchProducts(query: string, maxResults?: number): Promise<Product[]>;
    /**
     * SerpAPI Google Shopping search (best for products)
     */
    private serpApiSearch;
    /**
     * Extract currency from price string
     */
    private extractCurrency;
    /**
     * Generate AI agent products
     */
    private generateAgentProducts;
    /**
     * Real Google Custom Search implementation
     */
    private googleCustomSearch;
    /**
     * Check if URL is from a shopping/e-commerce site
     */
    private isShoppingSite;
    /**
     * Parse a search result into a Product
     */
    private parseSearchResult;
    /**
     * Check if title looks like a product listing
     */
    private looksLikeProductTitle;
    /**
     * Simulated search with enhanced product generation
     */
    private simulatedSearch;
    /**
     * Detect marketplace from URL
     */
    private detectMarketplace;
    /**
     * Extract price from text
     */
    private extractPrice;
    /**
     * Extract price range from query
     */
    private extractPriceRange;
    /**
     * Extract brand from query
     */
    private extractBrand;
    /**
     * Extract category from query
     */
    private extractCategory;
    /**
     * Generate product variants
     */
    private generateVariants;
    /**
     * Get typical price for category
     */
    private getTypicalPrice;
    /**
     * Check if result is relevant to query
     */
    private isRelevantToQuery;
    /**
     * Clean product title
     */
    private cleanTitle;
    /**
     * Get seller name from marketplace
     */
    private getSellerName;
    /**
     * Estimate rating based on marketplace
     */
    private estimateRating;
}
export declare const webSearchService: WebSearchService;
export {};
//# sourceMappingURL=webSearchService.d.ts.map