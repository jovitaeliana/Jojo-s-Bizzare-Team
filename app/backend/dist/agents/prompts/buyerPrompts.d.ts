/**
 * LLM Prompts for Buyer Agent
 *
 * These prompts guide the buyer agent's decision-making process
 * using Groq's LLM (llama-3.3-70b-versatile)
 */
export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    condition?: string;
    category?: string;
    sellerAddress?: string;
    sellerAgentId?: string;
}
/**
 * Prompt for product selection
 * Helps the agent choose the best product from available options
 */
export declare function createProductSelectionPrompt(userRequest: string, products: Product[]): string;
/**
 * Prompt for negotiation decision
 * Helps the agent decide whether to accept price, counter-offer, or reject
 */
export declare function createNegotiationPrompt(product: Product, userBudget?: number): string;
/**
 * Prompt for counter-offer evaluation
 * Helps the agent decide whether to accept seller's counter-offer
 */
export declare function createCounterOfferEvaluationPrompt(product: Product, originalOffer: number, sellerCounterOffer: number, sellerMessage: string, userBudget?: number): string;
/**
 * Prompt for delivery confirmation
 * Helps the agent decide whether to release escrow funds
 */
export declare function createDeliveryConfirmationPrompt(product: Product, sellerMessage: string, trackingInfo?: string): string;
/**
 * Prompt for error recovery
 * Helps the agent decide how to handle errors in the purchase flow
 */
export declare function createErrorRecoveryPrompt(currentStep: string, errorMessage: string, context: any): string;
//# sourceMappingURL=buyerPrompts.d.ts.map