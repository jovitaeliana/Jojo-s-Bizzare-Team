import { getJson } from 'serpapi';
class WebSearchService {
    googleApiKey;
    googleCseId;
    serpApiKey;
    defaultSearchParams;
    constructor() {
        // Enforce required API keys
        const serpApiKey = import.meta.env.VITE_SERP_API_KEY;
        if (!serpApiKey) {
            throw new Error('VITE_SERP_API_KEY is required for web search functionality');
        }
        this.serpApiKey = serpApiKey;
        this.googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
        this.googleCseId = import.meta.env.VITE_GOOGLE_CSE_ID || '';
        // Default search parameters
        this.defaultSearchParams = {
            google_domain: "google.com",
            gl: "us",
            hl: "en",
            safe: "active",
            location: "Singapore",
            device: "desktop",
            tbm: "shop"
        };
    }
    /**
     * Search for products on the internet using various search APIs
     */
    async searchProducts(query, maxResults = 7) {
        try {
            // Try SerpAPI first (best for shopping)
            if (this.serpApiKey && this.serpApiKey !== 'your_serpapi_key_here') {
                console.log('🔍 Using SerpAPI for real product search...');
                return await this.serpApiSearch(query, maxResults);
            }
            // Try Google Custom Search
            if (this.googleApiKey && this.googleApiKey !== 'your_google_api_key_here' && this.googleCseId) {
                console.log('🔍 Using Google Custom Search for product search...');
                return await this.googleCustomSearch(query, maxResults);
            }
            // Fallback to simulated search
            console.warn('⚠️ No search API configured. Using simulated search with enhanced realism.');
            console.warn('💡 For real product results, add VITE_SERP_API_KEY to .env');
            return await this.simulatedSearch(query, maxResults);
        }
        catch (error) {
            console.error('Web search error:', error);
            console.warn('⚠️ Search failed, falling back to simulated results');
            return await this.simulatedSearch(query, maxResults);
        }
    }
    /**
     * SerpAPI Google Shopping search (best for products)
     */
    async serpApiSearch(query, maxResults) {
        try {
            const searchParams = {
                ...this.defaultSearchParams,
                engine: "google_shopping",
                q: query,
                api_key: this.serpApiKey,
                num: maxResults
            };
            // Use serpapi's getJson method with promise wrapper
            const data = await new Promise((resolve, reject) => {
                getJson(searchParams, (json) => {
                    if (json.error) {
                        reject(new Error(json.error));
                    }
                    else {
                        resolve(json);
                    }
                });
            });
            if (!data.shopping_results || data.shopping_results.length === 0) {
                console.warn('No shopping results from SerpAPI');
                throw new Error('No results found');
            }
            const products = [];
            for (const item of data.shopping_results) {
                if (products.length >= maxResults)
                    break;
                const product = {
                    id: `serp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    title: item.title || 'Product',
                    price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0'),
                    currency: this.extractCurrency(item.price) || 'USD',
                    imageUrl: item.thumbnail || `https://via.placeholder.com/300x300?text=${encodeURIComponent(item.title || 'Product')}`,
                    source: this.detectMarketplace(item.link || ''),
                    seller: item.source || 'Online Seller',
                    sellerType: 'traditional',
                    rating: parseFloat(item.rating || '4.0'),
                    reviews: parseInt(item.reviews || '100'),
                    isVerified: true,
                    url: item.link,
                    description: item.snippet || item.title || '',
                };
                if (product.price > 0 && product.price < 100000) {
                    products.push(product);
                    console.log(`✓ SerpAPI found: ${product.title} - $${product.price} from ${product.seller}`);
                }
            }
            // Add some AI agent products
            const agentProducts = this.generateAgentProducts(query, 2);
            products.unshift(...agentProducts);
            return products;
        }
        catch (error) {
            console.error('SerpAPI search error:', error);
            throw error;
        }
    }
    /**
     * Extract currency from price string
     */
    extractCurrency(priceStr = '') {
        if (priceStr.includes('$'))
            return 'USD';
        if (priceStr.includes('€'))
            return 'EUR';
        if (priceStr.includes('£'))
            return 'GBP';
        if (priceStr.includes('¥'))
            return 'JPY';
        return 'USD';
    }
    /**
     * Generate AI agent products
     */
    generateAgentProducts(query, count) {
        const products = [];
        const category = this.extractCategory(query);
        const basePrice = this.getTypicalPrice(category);
        for (let i = 0; i < count; i++) {
            products.push({
                id: `agent-${Date.now()}-${i}`,
                title: `${category} Pro ${i + 1}`,
                price: Math.round((basePrice + i * 50) * 100) / 100,
                currency: 'USDC',
                imageUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(category)}`,
                source: 'agent',
                seller: `Agent-${Math.random().toString(36).substring(7).toUpperCase()}`,
                sellerType: 'ai-agent',
                rating: 4.5 + (Math.random() * 0.4),
                reviews: 120 + i * 30,
                isVerified: true,
                agentAddress: `0.0.${100000 + i}`,
                description: `Premium ${category} with AI agent warranty and instant blockchain payment`,
            });
        }
        return products;
    }
    /**
     * Real Google Custom Search implementation
     */
    async googleCustomSearch(query, maxResults) {
        try {
            // Target specific shopping domains
            const shoppingDomains = [
                'site:amazon.com OR',
                'site:ebay.com OR',
                'site:walmart.com OR',
                'site:newegg.com OR',
                'site:bestbuy.com OR',
                'site:etsy.com OR',
                'site:target.com OR',
                'site:aliexpress.com'
            ].join(' ');
            // Build search query focused on buying products
            const searchQuery = `${query} buy price ${shoppingDomains}`;
            // Google Custom Search JSON API with shopping focus
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.googleCseId}&q=${encodeURIComponent(searchQuery)}&num=10`;
            const response = await fetch(searchUrl);
            const data = await response.json();
            if (!data.items || data.items.length === 0) {
                throw new Error('No results found');
            }
            const products = [];
            for (const item of data.items) {
                // Only process if it's from a shopping site
                if (!this.isShoppingSite(item.link)) {
                    continue;
                }
                const product = await this.parseSearchResult(item, query);
                if (product && products.length < maxResults) {
                    products.push(product);
                }
            }
            // If we don't have enough products, supplement with simulated ones
            if (products.length < 3) {
                console.warn('Not enough real products found, supplementing with simulated results');
                const simulatedProducts = await this.simulatedSearch(query, maxResults - products.length);
                products.push(...simulatedProducts);
            }
            return products;
        }
        catch (error) {
            console.error('Google Custom Search error:', error);
            throw error;
        }
    }
    /**
     * Check if URL is from a shopping/e-commerce site
     */
    isShoppingSite(url) {
        const shoppingSites = [
            'amazon.com',
            'ebay.com',
            'walmart.com',
            'newegg.com',
            'bestbuy.com',
            'etsy.com',
            'target.com',
            'aliexpress.com',
            'alibaba.com',
            'overstock.com',
            'wayfair.com',
            'homedepot.com',
            'lowes.com',
        ];
        const lowerUrl = url.toLowerCase();
        // Must be from a shopping site
        if (!shoppingSites.some(site => lowerUrl.includes(site))) {
            return false;
        }
        // Exclude non-product pages
        const excludePatterns = [
            '/blog/',
            '/article/',
            '/news/',
            '/help/',
            '/support/',
            '/about/',
            '/customer-service/',
            '/returns/',
            '/shipping/',
            '/contact/',
            '/reviews',
            '/forum/',
            '/community/',
        ];
        return !excludePatterns.some(pattern => lowerUrl.includes(pattern));
    }
    /**
     * Parse a search result into a Product
     */
    async parseSearchResult(result, originalQuery) {
        try {
            const title = result.title || '';
            const url = result.link || '';
            const snippet = result.snippet || '';
            // Detect source marketplace
            const source = this.detectMarketplace(url);
            // Extract price from snippet or title
            const price = this.extractPrice(title + ' ' + snippet);
            // Validate this is a product listing (must have a price)
            if (price.amount === 0 || price.amount > 100000) {
                console.log(`Skipping result - invalid price: ${price.amount} for ${title}`);
                return null;
            }
            // Additional validation: title should look like a product
            if (!this.looksLikeProductTitle(title)) {
                console.log(`Skipping result - doesn't look like product: ${title}`);
                return null;
            }
            // Check relevance to query
            const isRelevant = this.isRelevantToQuery(title, snippet, originalQuery);
            if (!isRelevant) {
                console.log(`Skipping result - not relevant: ${title}`);
                return null;
            }
            const product = {
                id: `web-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                title: this.cleanTitle(title),
                price: price.amount,
                currency: price.currency,
                imageUrl: result.thumbnail || `https://via.placeholder.com/300x300?text=${encodeURIComponent(this.cleanTitle(title))}`,
                source: source,
                seller: this.getSellerName(source),
                sellerType: 'traditional',
                rating: this.estimateRating(source),
                reviews: Math.floor(Math.random() * 500) + 50,
                isVerified: ['amazon', 'ebay', 'walmart', 'newegg', 'bestbuy', 'target'].includes(source),
                url: url,
                description: snippet.substring(0, 200),
            };
            console.log(`✓ Found product: ${product.title} - $${product.price}`);
            return product;
        }
        catch (error) {
            console.error('Error parsing search result:', error);
            return null;
        }
    }
    /**
     * Check if title looks like a product listing
     */
    looksLikeProductTitle(title) {
        const lowerTitle = title.toLowerCase();
        // Exclude article/blog indicators
        const excludeWords = [
            'how to',
            'best of',
            'top 10',
            'top 5',
            'guide to',
            'review:',
            'article',
            'blog post',
            '5 ways',
            '10 tips',
            'ultimate guide',
            'everything you need to know',
            'what is',
            'why you should',
        ];
        return !excludeWords.some(word => lowerTitle.includes(word));
    }
    /**
     * Simulated search with enhanced product generation
     */
    async simulatedSearch(query, maxResults) {
        // Use Gemini to understand the query better
        const products = [];
        // Extract product category and attributes
        const category = this.extractCategory(query);
        const priceRange = this.extractPriceRange(query);
        const brand = this.extractBrand(query);
        const marketplaces = ['amazon', 'ebay', 'etsy', 'other'];
        const productVariants = this.generateVariants(query);
        for (let i = 0; i < maxResults; i++) {
            const marketplace = marketplaces[i % marketplaces.length];
            const variant = productVariants[i % productVariants.length];
            let price = priceRange.max > 0
                ? priceRange.min + (Math.random() * (priceRange.max - priceRange.min))
                : this.getTypicalPrice(category) * (0.7 + Math.random() * 0.6);
            // Add some AI agent products
            const isAIAgent = i < 2;
            products.push({
                id: isAIAgent ? `agent-${i}` : `trad-${i}`,
                title: `${brand || ''} ${variant} ${category}`.trim(),
                price: Math.round(price * 100) / 100,
                currency: isAIAgent ? 'USDC' : 'USD',
                imageUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(category)}`,
                source: isAIAgent ? 'agent' : marketplace,
                seller: isAIAgent ? `Agent-${Math.random().toString(36).substring(7).toUpperCase()}` : `${marketplace}-seller-${i}`,
                sellerType: isAIAgent ? 'ai-agent' : 'traditional',
                rating: 3.5 + Math.random() * 1.5,
                reviews: Math.floor(Math.random() * 500) + 50,
                isVerified: isAIAgent || i % 2 === 0,
                agentAddress: isAIAgent ? `0.0.${100000 + i}` : undefined,
                url: isAIAgent ? undefined : `https://${marketplace}.com/product/${i}`,
                description: `${variant} ${category} with excellent features and quality. ${brand ? `From ${brand}.` : ''}`,
            });
        }
        return products.sort(() => Math.random() - 0.5);
    }
    /**
     * Detect marketplace from URL
     */
    detectMarketplace(url) {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('amazon'))
            return 'amazon';
        if (lowerUrl.includes('ebay'))
            return 'ebay';
        if (lowerUrl.includes('etsy'))
            return 'etsy';
        return 'other';
    }
    /**
     * Extract price from text
     */
    extractPrice(text) {
        // Look for price patterns in various formats
        const pricePatterns = [
            /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/, // $99.99, $1,299.00
            /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/i, // 99.99 USD
            /Price:\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i, // Price: $99.99
            /(\d+\.\d{2})\s*dollars?/i, // 99.99 dollars
        ];
        for (const pattern of pricePatterns) {
            const match = text.match(pattern);
            if (match) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                // Sanity check the price
                if (amount > 0 && amount < 100000) {
                    return { amount, currency: 'USD' };
                }
            }
        }
        // No price found - return 0 so it can be filtered out
        return { amount: 0, currency: 'USD' };
    }
    /**
     * Extract price range from query
     */
    extractPriceRange(query) {
        const underMatch = query.match(/under\s+\$?(\d+)/i);
        const belowMatch = query.match(/below\s+\$?(\d+)/i);
        const rangeMatch = query.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
        const exactMatch = query.match(/\$(\d+)/);
        if (underMatch || belowMatch) {
            const max = parseInt(underMatch?.[1] || belowMatch?.[1] || '1000');
            return { min: Math.floor(max * 0.5), max };
        }
        if (rangeMatch) {
            return {
                min: parseInt(rangeMatch[1]),
                max: parseInt(rangeMatch[2]),
            };
        }
        if (exactMatch) {
            const price = parseInt(exactMatch[1]);
            return { min: Math.floor(price * 0.8), max: Math.floor(price * 1.2) };
        }
        return { min: 0, max: 0 };
    }
    /**
     * Extract brand from query
     */
    extractBrand(query) {
        const brands = ['Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'Sony', 'LG', 'Nike', 'Adidas',
            'Microsoft', 'Asus', 'Acer', 'Canon', 'Nikon', 'Razer', 'Logitech'];
        for (const brand of brands) {
            if (new RegExp(brand, 'i').test(query)) {
                return brand;
            }
        }
        return '';
    }
    /**
     * Extract category from query
     */
    extractCategory(query) {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('laptop'))
            return 'Laptop';
        if (lowerQuery.includes('phone') || lowerQuery.includes('smartphone'))
            return 'Smartphone';
        if (lowerQuery.includes('headphone') || lowerQuery.includes('earbuds'))
            return 'Headphones';
        if (lowerQuery.includes('watch') || lowerQuery.includes('smartwatch'))
            return 'Smartwatch';
        if (lowerQuery.includes('tablet'))
            return 'Tablet';
        if (lowerQuery.includes('keyboard'))
            return 'Keyboard';
        if (lowerQuery.includes('mouse'))
            return 'Mouse';
        if (lowerQuery.includes('monitor') || lowerQuery.includes('display'))
            return 'Monitor';
        if (lowerQuery.includes('camera'))
            return 'Camera';
        if (lowerQuery.includes('speaker'))
            return 'Speaker';
        return 'Product';
    }
    /**
     * Generate product variants
     */
    generateVariants(query) {
        return [
            query,
            `${query} online`,
            `buy ${query}`,
            `${query} sale`,
            `best ${query}`,
            `new ${query}`,
            `${query} shop`,
            `${query} deals`,
            `quality ${query}`,
            `premium ${query}`,
        ];
    }
    /**
     * Get typical price for category
     */
    getTypicalPrice(category) {
        const prices = {
            'Laptop': 800,
            'Smartphone': 600,
            'Headphones': 150,
            'Smartwatch': 300,
            'Tablet': 400,
            'Keyboard': 100,
            'Mouse': 60,
            'Monitor': 350,
            'Camera': 800,
            'Speaker': 200,
            'Product': 100,
        };
        return prices[category] || 100;
    }
    /**
     * Check if result is relevant to query
     */
    isRelevantToQuery(title, snippet, query) {
        const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
        const contentLower = (title + ' ' + snippet).toLowerCase();
        const matches = queryWords.filter(word => contentLower.includes(word));
        return matches.length >= Math.min(2, queryWords.length * 0.4);
    }
    /**
     * Clean product title
     */
    cleanTitle(title) {
        // Remove common noise from titles
        return title
            .replace(/\s*[-|:]\s*(Amazon|eBay|Walmart|Best Buy).*$/i, '')
            .replace(/\s*\|\s*.*$/i, '')
            .substring(0, 100)
            .trim();
    }
    /**
     * Get seller name from marketplace
     */
    getSellerName(marketplace) {
        const names = {
            'amazon': 'Amazon Marketplace',
            'ebay': 'eBay Seller',
            'etsy': 'Etsy Shop',
            'other': 'Online Seller',
        };
        return names[marketplace] || 'Online Seller';
    }
    /**
     * Estimate rating based on marketplace
     */
    estimateRating(marketplace) {
        const baseRatings = {
            'amazon': 4.3,
            'ebay': 4.0,
            'walmart': 4.2,
            'etsy': 4.5,
            'newegg': 4.1,
            'bestbuy': 4.4,
            'target': 4.3,
            'aliexpress': 3.8,
            'overstock': 4.1,
            'wayfair': 4.2,
        };
        const base = baseRatings[marketplace] || 4.0;
        return Math.round((base + (Math.random() * 0.4 - 0.2)) * 10) / 10;
    }
}
export const webSearchService = new WebSearchService();
//# sourceMappingURL=webSearchService.js.map