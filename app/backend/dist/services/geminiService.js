import { GoogleGenAI } from "@google/genai";
class GeminiService {
    ai;
    apiKey;
    constructor() {
        this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        this.ai = new GoogleGenAI({
            apiKey: this.apiKey,
        });
    }
    /**
     * Analyze user input to detect intent (buy or sell) and extract product information
     */
    async analyzeIntent(userInput, conversationContext) {
        try {
            if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
                // Fallback to simple keyword detection if no API key
                return this.fallbackIntentDetection(userInput);
            }
            const contextInfo = conversationContext && conversationContext.length > 0
                ? `\n\nPrevious conversation context:\n${conversationContext.join('\n')}`
                : '';
            const prompt = `You are an AI assistant for a marketplace application. Analyze the following user message and determine:

1. Intent: Is the user trying to "buy" something, "sell" something, or just having a "general" conversation?
2. Product name: What is the main product mentioned (extract the item name)?
3. Product details: Any specific details about the product (brand, price range, specs, condition, features, etc.)?
4. Needs more info: Does this query have enough information to search for products? Consider:
   - Is the product category clear?
   - For expensive items (electronics, appliances): Are important specs mentioned?
   - For common items: Is the basic description sufficient?
5. Missing info: What important details are missing (price range, brand, size, color, specifications, etc.)?
6. Search query: If enough info is available, what would be the optimal search query?

User message: "${userInput}"${contextInfo}

Respond in JSON format:
{
  "intent": "buy" | "sell" | "general",
  "productName": "extracted product name",
  "productDetails": "any specific details mentioned",
  "confidence": 0.0 to 1.0,
  "needsMoreInfo": true | false,
  "missingInfo": ["price range", "brand", "specs", etc.],
  "searchQuery": "optimized search query if enough info available"
}

Examples:
- "I want a laptop" -> needsMoreInfo: true, missingInfo: ["price range", "brand preference", "use case", "specifications"]
- "I want a gaming laptop under $1500 with RTX 4060" -> needsMoreInfo: false, searchQuery: "gaming laptop RTX 4060 under $1500"
- "Looking for headphones" -> needsMoreInfo: true, missingInfo: ["price range", "type (over-ear, in-ear)", "wireless or wired", "use case"]`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: prompt,
            });
            const text = response.text;
            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                return analysis;
            }
            // Fallback if parsing fails
            return this.fallbackIntentDetection(userInput);
        }
        catch (error) {
            console.error('Gemini intent analysis error:', error);
            return this.fallbackIntentDetection(userInput);
        }
    }
    /**
     * Generate clarifying questions when user query lacks information
     */
    async generateClarifyingQuestion(userInput, intentAnalysis) {
        try {
            if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
                return this.fallbackClarifyingQuestion(intentAnalysis);
            }
            const prompt = `You are Agora, a helpful shopping assistant. The user wants to buy "${intentAnalysis.productName}" but hasn't provided enough details.

User's request: "${userInput}"
Product: ${intentAnalysis.productName}
Missing information: ${intentAnalysis.missingInfo?.join(', ')}

Generate a friendly, natural clarifying question that asks for the most important missing details.
- Prioritize: price range, then brand preference, then specific requirements
- Ask for 2-3 details at once to be efficient
- Include helpful suggestions or examples
- Keep it conversational and friendly

Respond in JSON format:
{
  "question": "your clarifying question here",
  "missingFields": ["price range", "brand", etc.],
  "suggestions": ["option 1", "option 2", "option 3"] // optional helpful suggestions
}

Example:
{
  "question": "I'd be happy to help you find the perfect laptop! To give you the best recommendations, could you tell me:\n\n1. What's your budget range?\n2. What will you primarily use it for (gaming, work, general use)?\n3. Any preferred brands or must-have specs?",
  "missingFields": ["price range", "use case", "brand preference"],
  "suggestions": ["Gaming ($1000-$2000)", "Work/Productivity ($600-$1200)", "Budget-friendly ($300-$600)"]
}`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: prompt,
            });
            const text = response.text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return this.fallbackClarifyingQuestion(intentAnalysis);
        }
        catch (error) {
            console.error('Gemini clarifying question error:', error);
            return this.fallbackClarifyingQuestion(intentAnalysis);
        }
    }
    /**
     * Generate a natural response based on user intent and context
     */
    async generateResponse(userInput, intent, context = {}) {
        try {
            if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
                return this.fallbackResponse(intent, context);
            }
            let prompt = '';
            if (intent.intent === 'buy') {
                prompt = `You are Agora, an AI shopping assistant. The user wants to buy: "${intent.productName}".

User message: "${userInput}"
${context.productsCount ? `You found ${context.productsCount} products.` : 'You are searching for products.'}

Generate a helpful, concise response (2-3 sentences) that:
1. Acknowledges their request
2. Mentions you're searching across AI agent marketplaces and traditional platforms
3. If products were found, mention the count and encourage them to check the results

Keep it friendly and professional. Don't use emojis.`;
            }
            else if (intent.intent === 'sell') {
                prompt = `You are Agora, an AI marketplace assistant. The user wants to sell: "${intent.productName}".

User message: "${userInput}"

Generate a helpful, concise response (2-3 sentences) that:
1. Acknowledges they want to sell their item
2. Mentions you'll help them create a listing on the AI agent marketplace
3. Briefly mention the process is quick and easy

Keep it friendly and professional. Don't use emojis.`;
            }
            else {
                prompt = `You are Agora, an AI marketplace assistant for buying and selling products.

User message: "${userInput}"

Generate a helpful, concise response (1-2 sentences) that addresses their question or comment.

Keep it friendly and professional. Don't use emojis.`;
            }
            const response = await this.ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: prompt,
            });
            return response.text.trim();
        }
        catch (error) {
            console.error('Gemini response generation error:', error);
            return this.fallbackResponse(intent, context);
        }
    }
    /**
     * Analyze an image and extract product information
     */
    async analyzeImage(imageFile) {
        try {
            if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
                return 'similar items from image';
            }
            // Convert image to base64
            const base64Image = await this.fileToBase64(imageFile);
            const prompt = `You are analyzing a product image. Describe the product you see in 3-5 words that could be used as a search query. Focus on the main item, its category, and key features.

For example:
- "wireless bluetooth headphones black"
- "red leather handbag designer"
- "gaming laptop rgb keyboard"

Respond with ONLY the search query, no additional text.`;
            const response = await this.ai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: imageFile.type,
                                    data: base64Image,
                                },
                            },
                        ],
                    },
                ],
            });
            return response.text.trim();
        }
        catch (error) {
            console.error('Gemini image analysis error:', error);
            return 'similar items from image';
        }
    }
    /**
     * Fallback intent detection using simple keyword matching
     */
    fallbackIntentDetection(userInput) {
        const lowerInput = userInput.toLowerCase();
        const sellKeywords = ['sell', 'selling', 'list', 'listing', 'i have', 'i want to sell', 'put up for sale'];
        if (sellKeywords.some(keyword => lowerInput.includes(keyword))) {
            const item = this.extractItemFromSellIntent(userInput);
            return {
                intent: 'sell',
                productName: item,
                productDetails: userInput,
                confidence: 0.7,
                needsMoreInfo: false,
                searchQuery: item,
            };
        }
        // Check if query is too vague for buying
        const words = userInput.split(' ').filter(w => w.length > 2);
        const hasPrice = /\$|usd|dollar|price|budget|under|below|cheap|expensive/i.test(userInput);
        const hasBrand = /apple|samsung|dell|hp|lenovo|sony|lg|nike|adidas/i.test(userInput);
        const hasSpecs = /gb|ram|storage|intel|amd|cpu|gpu|processor|screen|inch/i.test(userInput);
        const needsMoreInfo = words.length <= 3 && !hasPrice && !hasBrand && !hasSpecs;
        return {
            intent: 'buy',
            productName: userInput,
            productDetails: userInput,
            confidence: 0.7,
            needsMoreInfo,
            missingInfo: needsMoreInfo ? ['price range', 'brand preference', 'specifications'] : [],
            searchQuery: needsMoreInfo ? '' : userInput,
        };
    }
    /**
     * Fallback clarifying question generation
     */
    fallbackClarifyingQuestion(intentAnalysis) {
        const missingInfo = intentAnalysis.missingInfo || ['details'];
        let question = `I'd be happy to help you find ${intentAnalysis.productName}! `;
        question += `To give you the best recommendations, could you provide more details?\n\n`;
        if (missingInfo.includes('price range') || missingInfo.includes('budget')) {
            question += `1. What's your budget range?\n`;
        }
        if (missingInfo.includes('brand')) {
            question += `2. Do you have any brand preferences?\n`;
        }
        if (missingInfo.includes('specs') || missingInfo.includes('specifications')) {
            question += `3. Any must-have features or specifications?\n`;
        }
        return {
            question,
            missingFields: missingInfo,
            suggestions: ['Budget-friendly ($0-$500)', 'Mid-range ($500-$1500)', 'Premium ($1500+)'],
        };
    }
    /**
     * Extract item name from sell intent
     */
    extractItemFromSellIntent(userInput) {
        const patterns = [
            /i (?:want to |would like to )?sell(?: a| an| my)? /gi,
            /i (?:want to |would like to )?list(?: a| an| my)? /gi,
            /i have (?:a |an |my )?/gi,
            /(?:put up for sale |selling )/gi,
        ];
        let item = userInput;
        patterns.forEach(pattern => {
            item = item.replace(pattern, '');
        });
        return item.trim();
    }
    /**
     * Fallback response generation
     */
    fallbackResponse(intent, context = {}) {
        if (intent.intent === 'sell') {
            return `Great! I'll help you list "${intent.productName}" on the AI agent marketplace. Let me guide you through creating your listing with optimal pricing and presentation. This will only take a moment!`;
        }
        if (context.productsCount) {
            return `I found ${context.productsCount} options for "${intent.productName}". I've searched across AI agent marketplaces and traditional platforms. Check out the results on the right!`;
        }
        return `I'm searching for "${intent.productName}" across multiple platforms including AI agent marketplaces and traditional e-commerce sites. This may take a moment...`;
    }
    /**
     * Convert File to base64 string
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}
export const geminiService = new GeminiService();
//# sourceMappingURL=geminiService.js.map