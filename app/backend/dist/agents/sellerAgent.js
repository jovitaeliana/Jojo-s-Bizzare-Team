/**
 * Seller Agent - LangGraph Implementation
 *
 * Autonomous seller agent that:
 * 1. Creates and publishes product listings
 * 2. Listens for buyer offers via A2A protocol
 * 3. Evaluates offers using LLM
 * 4. Accepts/rejects/counters offers
 * 5. Confirms shipment after payment
 */
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { sellingAgentService } from "../services/sellingAgent.js";
import { createOfferEvaluationPrompt, createShipmentConfirmationPrompt, } from "./prompts/sellerPrompts.js";
// LangGraph 0.2.x state
const SellerState = Annotation.Root({
    listing: Annotation({ reducer: (x, y) => (y !== undefined ? y : x), default: () => null }),
    incomingOffers: Annotation({ reducer: (x, y) => y || x, default: () => [] }),
    currentOffer: Annotation({ reducer: (x, y) => (y !== undefined ? y : x), default: () => null }),
    offerEvaluation: Annotation({ reducer: (x, y) => (y !== undefined ? y : x), default: () => null }),
    paymentReceived: Annotation({ reducer: (x, y) => y, default: () => false }),
    shipmentConfirmed: Annotation({ reducer: (x, y) => y, default: () => false }),
    currentStep: Annotation({ reducer: (x, y) => y, default: () => "start" }),
    error: Annotation({ reducer: (x, y) => (y !== undefined ? y : x), default: () => null }),
    finalResult: Annotation({ reducer: (x, y) => (y !== undefined ? y : x), default: () => null }),
});
export class SellerAgent {
    llm;
    graph;
    constructor(apiKey) {
        this.llm = new ChatGroq({ apiKey, model: "llama-3.3-70b-versatile", temperature: 0.7 });
        this.graph = this.buildGraph();
    }
    safeParseJSON(raw) {
        if (typeof raw !== 'string')
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            const start = raw.indexOf('{');
            const end = raw.lastIndexOf('}');
            if (start >= 0 && end > start) {
                const candidate = raw.slice(start, end + 1);
                try {
                    return JSON.parse(candidate);
                }
                catch { }
            }
            return null;
        }
    }
    buildGraph() {
        return new StateGraph(SellerState)
            .addNode("list", this.listNode.bind(this))
            .addNode("wait", this.waitNode.bind(this))
            .addNode("evaluate", this.evaluateNode.bind(this))
            .addNode("accept", this.acceptNode.bind(this))
            .addNode("ship", this.shipNode.bind(this))
            .addEdge(START, "list")
            .addEdge("list", "wait")
            .addConditionalEdges("wait", this.hasOffer.bind(this))
            .addConditionalEdges("evaluate", this.shouldAccept.bind(this))
            .addConditionalEdges("accept", this.hasPayment.bind(this))
            .addEdge("ship", END)
            .compile();
    }
    // Nodes
    async listNode(state) {
        console.log("\n📝 [LIST] Creating product listing...");
        if (!state.listing) {
            return { currentStep: "list", error: "No listing provided" };
        }
        try {
            const listing = await sellingAgentService.createListing(state.listing.title, state.listing.description, state.listing.price, state.listing.currency, undefined, state.listing.condition, state.listing.category);
            await sellingAgentService.publishListing(listing.id, state.listing.sellerAddress || process.env.SELLER_EVM_ADDRESS || "");
            console.log(`   ✅ Listing published: ${listing.id}`);
            return { listing: listing, currentStep: "list", error: null };
        }
        catch (error) {
            console.error("   ❌ Listing failed:", error.message);
            return { currentStep: "list", error: error.message };
        }
    }
    async waitNode(state) {
        console.log("\n⏳ [WAIT] Waiting for buyer offers...");
        if (state.incomingOffers.length > 0) {
            const nextOffer = state.incomingOffers[0];
            console.log(`   📥 Received offer from buyer ${nextOffer.buyerAgentId}`);
            return { currentOffer: nextOffer, currentStep: "wait", error: null };
        }
        return { currentStep: "wait", error: null };
    }
    async evaluateNode(state) {
        console.log("\n🤔 [EVALUATE] Evaluating buyer offer with LLM...");
        if (!state.listing || !state.currentOffer) {
            return { offerEvaluation: null, currentStep: "evaluate", error: "No listing or offer to evaluate" };
        }
        try {
            const prompt = createOfferEvaluationPrompt(state.listing, state.currentOffer);
            const response = await this.llm.invoke(prompt);
            const evaluation = this.safeParseJSON(response.content) || {
                acceptable: true,
                action: 'accept',
                message: 'Deal! Your offer works for me.',
            };
            console.log(`   Action: ${evaluation.action}`);
            return { offerEvaluation: evaluation, currentStep: "evaluate", error: null };
        }
        catch (error) {
            console.error("   ❌ Evaluation failed:", error.message);
            return { offerEvaluation: null, currentStep: "evaluate", error: error.message };
        }
    }
    async acceptNode(state) {
        console.log("\n✅ [ACCEPT] Accepting offer...");
        if (!state.offerEvaluation || !state.offerEvaluation.acceptable) {
            return { currentStep: "accept", error: "No acceptable offer" };
        }
        try {
            console.log(`   📤 Sending acceptance message to buyer`);
            return { currentStep: "accept", error: null };
        }
        catch (error) {
            console.error("   ❌ Acceptance failed:", error.message);
            return { currentStep: "accept", error: error.message };
        }
    }
    async shipNode(state) {
        console.log("\n📦 [SHIP] Confirming shipment...");
        if (!state.listing || !state.paymentReceived) {
            return { currentStep: "ship", error: "Cannot ship: no payment received", finalResult: null };
        }
        try {
            const prompt = createShipmentConfirmationPrompt(state.listing, state.currentOffer?.buyerAddress || "Unknown", `TRACK-${Date.now()}`);
            const response = await this.llm.invoke(prompt);
            const shipmentInfo = JSON.parse(response.content);
            if (state.listing.id) {
                await sellingAgentService.markAsSold(state.listing.id, state.currentOffer?.buyerAddress || "");
            }
            return {
                shipmentConfirmed: true,
                currentStep: "ship",
                error: null,
                finalResult: { success: true, listing: state.listing, soldPrice: state.currentOffer?.offerPrice, shipmentInfo },
            };
        }
        catch (error) {
            console.error("   ❌ Shipment failed:", error.message);
            return { shipmentConfirmed: false, currentStep: "ship", error: error.message, finalResult: null };
        }
    }
    // Conditionals
    hasOffer(state) {
        return state.currentOffer ? "evaluate" : "wait";
    }
    shouldAccept(state) {
        return state.offerEvaluation?.acceptable ? "accept" : "wait";
    }
    hasPayment(state) {
        return state.paymentReceived ? "ship" : "wait";
    }
    // A2A message handler (used by A2A server)
    async handleBuyerMessage(message, agentId) {
        console.log("\n📨 [SELLER AGENT] Received message from buyer");
        try {
            const text = message.parts[0]?.text?.toLowerCase() || '';
            // Check if this is a listing request
            if (text.includes('show me') || text.includes('available products') || text.includes('listings') || text.includes('all products')) {
                return await this.handleListingRequest(message);
            }
            // Check if this is a purchase offer
            if (message.metadata?.type === 'purchase_offer') {
                return await this.handlePurchaseOffer(message, agentId);
            }
            // Default response
            return {
                role: "agent",
                parts: [{ kind: "text", text: "How can I help you? You can ask to see my products or make an offer." }],
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error("   ❌ Message handling failed:", error.message);
            return {
                role: "agent",
                parts: [{ kind: "text", text: "Error processing your request" }],
                metadata: { error: error.message },
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Handle listing request from buyer
     */
    async handleListingRequest(message) {
        console.log("   📋 Handling listing request");
        // Get all active listings from sellingAgentService
        const allListings = sellingAgentService.getAllListings();
        const activeListings = allListings.filter(l => l.status === 'active');
        console.log(`   ✅ Found ${activeListings.length} active listings`);
        // Format listings for response
        const listings = activeListings.map(l => ({
            id: l.id,
            title: l.title,
            description: l.description,
            price: l.price,
            currency: l.currency,
            condition: l.condition,
            category: l.category,
            sellerAddress: l.sellerAddress // Include seller's Hedera account ID
        }));
        return {
            role: 'agent',
            parts: [{ kind: 'text', text: `I have ${listings.length} products available` }],
            metadata: {
                type: 'listing_response',
                listings: listings
            },
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Handle purchase offer from buyer
     */
    async handlePurchaseOffer(message, agentId) {
        console.log("   💰 Handling purchase offer");
        const offerPrice = message.metadata?.offerPrice || 0;
        const productId = message.metadata?.productId || "";
        const buyerMessage = message.parts[0]?.text || "";
        const listing = sellingAgentService.getListing(productId);
        if (!listing) {
            return {
                role: "agent",
                parts: [{ kind: "text", text: "Product not found" }],
                metadata: { accepted: false, error: "Product not found" },
                timestamp: new Date().toISOString()
            };
        }
        const buyerOffer = {
            buyerAgentId: agentId,
            buyerAddress: message.metadata?.buyerAddress,
            offerPrice,
            currency: listing.currency,
            message: buyerMessage,
            timestamp: new Date().toISOString(),
        };
        const prompt = createOfferEvaluationPrompt(listing, buyerOffer);
        const response = await this.llm.invoke(prompt);
        const evaluation = this.safeParseJSON(response.content) || {
            acceptable: true,
            action: 'accept',
            message: 'Offer accepted'
        };
        return {
            role: "agent",
            parts: [{ kind: "text", text: evaluation.message }],
            metadata: {
                accepted: evaluation.acceptable,
                action: evaluation.action,
                counterOffer: evaluation.counterOffer,
                escrowAddress: process.env.ESCROW_FACTORY_ADDRESS
            },
            timestamp: new Date().toISOString()
        };
    }
    // Execute state machine once for a listing
    async executeSale(listing) {
        console.log("\n" + "=".repeat(60));
        console.log("🤖 SELLER AGENT - Starting Sale Workflow");
        console.log("=".repeat(60));
        const initialState = {
            listing,
            incomingOffers: [],
            currentOffer: null,
            offerEvaluation: null,
            paymentReceived: false,
            shipmentConfirmed: false,
            currentStep: "start",
            error: null,
            finalResult: null,
        };
        const result = await this.graph.invoke(initialState);
        console.log("🎉 SELLER AGENT - Workflow Complete");
        return result;
    }
}
// Export singleton instance
let sellerAgentInstance = null;
export function getSellerAgent() {
    if (!sellerAgentInstance) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey)
            throw new Error("GROQ_API_KEY not found in environment variables");
        sellerAgentInstance = new SellerAgent(apiKey);
    }
    return sellerAgentInstance;
}
//# sourceMappingURL=sellerAgent.js.map