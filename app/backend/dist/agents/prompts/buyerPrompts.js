/**
 * LLM Prompts for Buyer Agent
 *
 * These prompts guide the buyer agent's decision-making process
 * using Groq's LLM (llama-3.3-70b-versatile)
 */
/**
 * Prompt for product selection
 * Helps the agent choose the best product from available options
 */
export function createProductSelectionPrompt(userRequest, products) {
    const productsText = products
        .map((p, i) => `${i + 1}. ${p.title}
   Price: ${p.price} ${p.currency}
   Condition: ${p.condition || "Not specified"}
   Description: ${p.description}
   Seller: ${p.sellerAddress || "Unknown"}
   Product ID: ${p.id}`)
        .join("\n\n");
    return `You are an intelligent buyer agent helping a user find the best product on a decentralized marketplace.

USER REQUEST:
"${userRequest}"

AVAILABLE PRODUCTS:
${productsText}

TASK:
Analyze the available products and select the ONE that best matches the user's needs.

EVALUATION CRITERIA:
1. **Relevance**: How well does the product match the user's request?
2. **Price**: Is the price reasonable for the product?
3. **Condition**: Is the condition acceptable?
4. **Description Quality**: Is the product well-described?

RESPONSE FORMAT (JSON only, no explanation):
{
  "selectedProductId": "product-id-here",
  "reasoning": "Brief explanation of why this product is the best match",
  "confidence": 0.85
}

If NO products match the user's request, return:
{
  "selectedProductId": null,
  "reasoning": "No suitable products found because...",
  "confidence": 0.0
}`;
}
/**
 * Prompt for negotiation decision
 * Helps the agent decide whether to accept price, counter-offer, or reject
 */
export function createNegotiationPrompt(product, userBudget) {
    const budgetText = userBudget
        ? `User's Budget: ${userBudget} ${product.currency}`
        : "User's Budget: Not specified (use your judgment)";
    return `You are an intelligent buyer agent negotiating a purchase on behalf of a user.

PRODUCT DETAILS:
- Title: ${product.title}
- Listed Price: ${product.price} ${product.currency}
- Condition: ${product.condition || "Not specified"}
- Description: ${product.description}

${budgetText}

TASK:
Decide on the best negotiation strategy.

NEGOTIATION RULES:
1. If listed price is within budget (or reasonable), ACCEPT it
2. If listed price is slightly above budget (10-20%), make a COUNTER-OFFER
3. If listed price is way above budget (>20%), REJECT and look for alternatives
4. Always be polite and professional in your message

RESPONSE FORMAT (JSON only):
{
  "action": "accept" | "counter" | "reject",
  "offerPrice": <number or null>,
  "message": "Polite message to seller explaining your offer",
  "reasoning": "Internal reasoning for this decision"
}

EXAMPLES:

Accept:
{
  "action": "accept",
  "offerPrice": ${product.price},
  "message": "I'd like to purchase your ${product.title} at the listed price of ${product.price} ${product.currency}. Please provide payment details.",
  "reasoning": "Price is within budget and product matches requirements"
}

Counter-offer:
{
  "action": "counter",
  "offerPrice": ${product.price * 0.85},
  "message": "I'm interested in your ${product.title}. Would you consider ${product.price * 0.85} ${product.currency}? I'm ready to pay immediately.",
  "reasoning": "Price is slightly above budget, attempting negotiation"
}

Reject:
{
  "action": "reject",
  "offerPrice": null,
  "message": "Thank you for your listing, but the price is outside my budget at this time.",
  "reasoning": "Price significantly exceeds budget"
}`;
}
/**
 * Prompt for counter-offer evaluation
 * Helps the agent decide whether to accept seller's counter-offer
 */
export function createCounterOfferEvaluationPrompt(product, originalOffer, sellerCounterOffer, sellerMessage, userBudget) {
    const budgetText = userBudget
        ? `User's Budget: ${userBudget} ${product.currency}`
        : "User's Budget: Not specified";
    return `You are an intelligent buyer agent evaluating a seller's counter-offer.

NEGOTIATION CONTEXT:
- Product: ${product.title}
- Original Listed Price: ${product.price} ${product.currency}
- Your Offer: ${originalOffer} ${product.currency}
- Seller's Counter-Offer: ${sellerCounterOffer} ${product.currency}
- ${budgetText}

SELLER'S MESSAGE:
"${sellerMessage}"

TASK:
Decide whether to accept the seller's counter-offer or walk away.

DECISION CRITERIA:
1. Is the counter-offer within budget?
2. Is the counter-offer reasonable given the product value?
3. Is this the best deal available?

RESPONSE FORMAT (JSON only):
{
  "action": "accept" | "reject" | "counter_again",
  "finalOffer": <number or null>,
  "message": "Response to seller",
  "reasoning": "Why you made this decision"
}`;
}
/**
 * Prompt for delivery confirmation
 * Helps the agent decide whether to release escrow funds
 */
export function createDeliveryConfirmationPrompt(product, sellerMessage, trackingInfo) {
    const trackingText = trackingInfo
        ? `Tracking Information: ${trackingInfo}`
        : "Tracking Information: Not provided";
    return `You are an intelligent buyer agent confirming product delivery.

PURCHASE DETAILS:
- Product: ${product.title}
- Price Paid: ${product.price} ${product.currency}
- Seller: ${product.sellerAddress}

SELLER'S SHIPMENT MESSAGE:
"${sellerMessage}"

${trackingText}

TASK:
Determine if you should release the escrow funds to the seller.

RELEASE CRITERIA:
1. Seller has confirmed shipment
2. Tracking information provided (if applicable)
3. Message seems legitimate and professional

RESPONSE FORMAT (JSON only):
{
  "shouldRelease": true | false,
  "message": "Message to seller",
  "reasoning": "Why you made this decision"
}

IMPORTANT:
- If shipment is confirmed with tracking, release funds
- If message seems suspicious or incomplete, request more information
- Always be fair to the seller`;
}
/**
 * Prompt for error recovery
 * Helps the agent decide how to handle errors in the purchase flow
 */
export function createErrorRecoveryPrompt(currentStep, errorMessage, context) {
    return `You are an intelligent buyer agent handling an error in the purchase process.

CURRENT STEP: ${currentStep}
ERROR: ${errorMessage}

CONTEXT:
${JSON.stringify(context, null, 2)}

TASK:
Decide on the best recovery action.

POSSIBLE ACTIONS:
1. "retry" - Try the same step again
2. "skip" - Skip this step and continue
3. "abort" - Cancel the entire purchase
4. "notify_user" - Ask user for help

RESPONSE FORMAT (JSON only):
{
  "action": "retry" | "skip" | "abort" | "notify_user",
  "message": "Explanation for the user",
  "reasoning": "Why you chose this action"
}`;
}
//# sourceMappingURL=buyerPrompts.js.map