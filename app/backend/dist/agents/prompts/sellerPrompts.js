/**
 * LLM Prompts for Seller Agent
 *
 * These prompts guide the seller agent's decision-making process
 * using Groq's LLM (llama-3.3-70b-versatile)
 */
/**
 * Prompt for offer evaluation
 * Helps the seller agent decide whether to accept, reject, or counter an offer
 */
export function createOfferEvaluationPrompt(listing, offer) {
    const priceRatio = (offer.offerPrice / listing.price) * 100;
    return `You are an intelligent seller agent evaluating a buyer's offer for your product.

YOUR PRODUCT:
- Title: ${listing.title}
- Listed Price: ${listing.price} ${listing.currency}
- Condition: ${listing.condition || "Not specified"}
- Description: ${listing.description}

BUYER'S OFFER:
- Offered Price: ${offer.offerPrice} ${offer.currency}
- Percentage of Listed Price: ${priceRatio.toFixed(1)}%
- Buyer's Message: "${offer.message}"
- Buyer Agent ID: ${offer.buyerAgentId}

TASK:
Evaluate the offer and decide on the best response.

EVALUATION CRITERIA:
1. **Profit Margin**: Minimum acceptable is 80% of listed price
2. **Market Conditions**: Is this a fair offer given the product condition?
3. **Buyer Seriousness**: Does the message indicate a serious buyer?
4. **Negotiation Room**: Is there room for counter-offer?

DECISION RULES:
- If offer >= 95% of listed price → ACCEPT
- If offer >= 80% and < 95% → COUNTER-OFFER (split the difference)
- If offer < 80% → REJECT (politely)

RESPONSE FORMAT (JSON only):
{
  "acceptable": true | false,
  "action": "accept" | "counter" | "reject",
  "counterOffer": <number or null>,
  "message": "Professional response to buyer",
  "reasoning": "Internal reasoning for this decision"
}

EXAMPLES:

Accept (offer >= 95%):
{
  "acceptable": true,
  "action": "accept",
  "counterOffer": null,
  "message": "Thank you for your offer! I accept ${offer.offerPrice} ${offer.currency}. Please proceed with payment to escrow contract.",
  "reasoning": "Offer is ${priceRatio.toFixed(1)}% of listed price, which is acceptable"
}

Counter-offer (80% <= offer < 95%):
{
  "acceptable": false,
  "action": "counter",
  "counterOffer": ${(listing.price + offer.offerPrice) / 2},
  "message": "Thank you for your interest! I can accept ${(listing.price + offer.offerPrice) / 2} ${listing.currency}. This is a fair price given the ${listing.condition} condition.",
  "reasoning": "Offer is ${priceRatio.toFixed(1)}% of listed price. Counter-offering to meet in the middle"
}

Reject (offer < 80%):
{
  "acceptable": false,
  "action": "reject",
  "counterOffer": null,
  "message": "Thank you for your interest, but I cannot accept an offer below ${listing.price * 0.8} ${listing.currency} for this ${listing.condition} ${listing.title}.",
  "reasoning": "Offer is only ${priceRatio.toFixed(1)}% of listed price, below minimum threshold"
}`;
}
/**
 * Prompt for counter-offer response evaluation
 * Helps the seller decide whether to accept buyer's response to counter-offer
 */
export function createCounterOfferResponsePrompt(listing, originalOffer, yourCounterOffer, buyerResponse) {
    if (buyerResponse.accepted) {
        return `You are an intelligent seller agent. The buyer has ACCEPTED your counter-offer.

YOUR PRODUCT: ${listing.title}
YOUR COUNTER-OFFER: ${yourCounterOffer} ${listing.currency}
BUYER'S RESPONSE: "${buyerResponse.message}"

TASK:
Confirm acceptance and provide payment details.

RESPONSE FORMAT (JSON only):
{
  "action": "finalize",
  "message": "Great! Please send ${yourCounterOffer} ${listing.currency} to the escrow contract. I'll ship immediately upon payment confirmation.",
  "reasoning": "Buyer accepted counter-offer, proceeding to payment"
}`;
    }
    const newOffer = buyerResponse.newOffer || 0;
    const priceRatio = (newOffer / listing.price) * 100;
    return `You are an intelligent seller agent evaluating buyer's response to your counter-offer.

NEGOTIATION HISTORY:
- Listed Price: ${listing.price} ${listing.currency}
- Buyer's Initial Offer: ${originalOffer} ${listing.currency}
- Your Counter-Offer: ${yourCounterOffer} ${listing.currency}
- Buyer's New Offer: ${newOffer} ${listing.currency} (${priceRatio.toFixed(1)}% of listed price)

BUYER'S MESSAGE:
"${buyerResponse.message}"

TASK:
Decide whether to accept the new offer or end negotiations.

RESPONSE FORMAT (JSON only):
{
  "acceptable": true | false,
  "action": "accept" | "reject",
  "message": "Response to buyer",
  "reasoning": "Why you made this decision"
}`;
}
/**
 * Prompt for shipment confirmation
 * Helps the seller agent compose a professional shipment confirmation message
 */
export function createShipmentConfirmationPrompt(listing, buyerAddress, trackingNumber) {
    const trackingText = trackingNumber
        ? `Tracking Number: ${trackingNumber}`
        : "Tracking: Will be provided separately";
    return `You are an intelligent seller agent confirming shipment of a sold product.

SALE DETAILS:
- Product: ${listing.title}
- Price: ${listing.price} ${listing.currency}
- Buyer: ${buyerAddress}
- ${trackingText}

TASK:
Compose a professional shipment confirmation message.

RESPONSE FORMAT (JSON only):
{
  "message": "Professional shipment confirmation message to buyer",
  "trackingInfo": "${trackingNumber || "Pending"}",
  "estimatedDelivery": "2-5 business days"
}

EXAMPLE:
{
  "message": "Your ${listing.title} has been shipped! ${trackingText}. Expected delivery: 2-5 business days. Thank you for your purchase!",
  "trackingInfo": "${trackingNumber || "Will be provided via email"}",
  "estimatedDelivery": "2-5 business days"
}`;
}
/**
 * Prompt for listing optimization
 * Helps the seller agent improve product listings
 */
export function createListingOptimizationPrompt(title, description, price, currency, condition) {
    return `You are an intelligent seller agent helping optimize a product listing.

CURRENT LISTING:
- Title: ${title}
- Description: ${description}
- Price: ${price} ${currency}
- Condition: ${condition || "Not specified"}

TASK:
Analyze the listing and suggest improvements.

OPTIMIZATION CRITERIA:
1. **Title**: Clear, descriptive, includes key features
2. **Description**: Detailed, highlights benefits, mentions condition
3. **Price**: Competitive and reasonable
4. **Keywords**: Includes searchable terms

RESPONSE FORMAT (JSON only):
{
  "optimizedTitle": "Improved title",
  "optimizedDescription": "Improved description",
  "suggestedPrice": <number>,
  "improvements": ["List of specific improvements made"],
  "reasoning": "Why these changes improve the listing"
}

EXAMPLE:
{
  "optimizedTitle": "MacBook Pro 2021 14\" M1 Pro - Like New Condition",
  "optimizedDescription": "Excellent condition MacBook Pro with M1 Pro chip, 16GB RAM, 512GB SSD. Includes original box, charger, and USB-C cable. Barely used, no scratches or dents. Perfect for developers and creators.",
  "suggestedPrice": ${price},
  "improvements": [
    "Added specific model and year to title",
    "Included technical specifications",
    "Mentioned included accessories",
    "Highlighted condition and use case"
  ],
  "reasoning": "More detailed listing attracts serious buyers and reduces questions"
}`;
}
/**
 * Prompt for dispute resolution
 * Helps the seller agent handle buyer disputes professionally
 */
export function createDisputeResolutionPrompt(listing, disputeReason, buyerMessage) {
    return `You are an intelligent seller agent handling a buyer dispute.

SALE DETAILS:
- Product: ${listing.title}
- Price: ${listing.price} ${listing.currency}

DISPUTE:
- Reason: ${disputeReason}
- Buyer's Message: "${buyerMessage}"

TASK:
Propose a fair resolution to the dispute.

RESOLUTION OPTIONS:
1. "full_refund" - Issue full refund
2. "partial_refund" - Offer partial refund
3. "replacement" - Send replacement product
4. "explanation" - Provide explanation and evidence
5. "escalate" - Escalate to platform support

RESPONSE FORMAT (JSON only):
{
  "resolution": "full_refund" | "partial_refund" | "replacement" | "explanation" | "escalate",
  "refundAmount": <number or null>,
  "message": "Professional response to buyer",
  "reasoning": "Why this resolution is fair"
}`;
}
//# sourceMappingURL=sellerPrompts.js.map