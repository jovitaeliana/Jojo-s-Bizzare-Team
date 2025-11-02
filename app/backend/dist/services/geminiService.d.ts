export interface IntentAnalysis {
    intent: 'buy' | 'sell' | 'general';
    productName: string;
    productDetails: string;
    confidence: number;
    needsMoreInfo: boolean;
    missingInfo?: string[];
    searchQuery?: string;
}
export interface ClarifyingQuestion {
    question: string;
    missingFields: string[];
    suggestions?: string[];
}
export interface ChatResponse {
    message: string;
    intent: IntentAnalysis;
}
declare class GeminiService {
    private ai;
    private apiKey;
    constructor();
    /**
     * Analyze user input to detect intent (buy or sell) and extract product information
     */
    analyzeIntent(userInput: string, conversationContext?: string[]): Promise<IntentAnalysis>;
    /**
     * Generate clarifying questions when user query lacks information
     */
    generateClarifyingQuestion(userInput: string, intentAnalysis: IntentAnalysis): Promise<ClarifyingQuestion>;
    /**
     * Generate a natural response based on user intent and context
     */
    generateResponse(userInput: string, intent: IntentAnalysis, context?: {
        hasProducts?: boolean;
        productsCount?: number;
    }): Promise<string>;
    /**
     * Analyze an image and extract product information
     */
    analyzeImage(imageFile: File): Promise<string>;
    /**
     * Fallback intent detection using simple keyword matching
     */
    private fallbackIntentDetection;
    /**
     * Fallback clarifying question generation
     */
    private fallbackClarifyingQuestion;
    /**
     * Extract item name from sell intent
     */
    private extractItemFromSellIntent;
    /**
     * Fallback response generation
     */
    private fallbackResponse;
    /**
     * Convert File to base64 string
     */
    private fileToBase64;
}
export declare const geminiService: GeminiService;
export {};
//# sourceMappingURL=geminiService.d.ts.map