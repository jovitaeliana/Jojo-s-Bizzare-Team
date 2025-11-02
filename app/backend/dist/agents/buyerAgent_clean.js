/**
 * Buyer Agent - Clean LangGraph 0.2.x Implementation
 *
 * Simplified autonomous buyer agent for MVP demo:
 * 1. Discovers sellers using discovery service
 * 2. Selects best product using LLM
 * 3. Negotiates price via A2A protocol
 * 4. Executes payment via x402
 * 5. Confirms delivery
 */
import { StateGraph, END, Annotation, START } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { DiscoveryService } from "../services/discovery.js";
import { A2AClient } from "../services/a2aClient.js";
import { X402Service } from "../services/x402.js";
/**
 * Buyer Agent State (LangGraph 0.2.x Annotation API)
 */
const BuyerState = Annotation.Root({
    // Input
    userRequest: Annotation(),
    budget: Annotation(),
    // Discovery
    discoveredProducts: Annotation({
        default: () => []
    }),
    selectedProduct: Annotation({
        default: () => null
    }),
    // Negotiation
    currentOffer: Annotation(),
    negotiationHistory: Annotation({
        default: () => []
    }),
    agreedPrice: Annotation(),
    // Payment
    paymentId: Annotation({
        default: () => null
    }),
    // Status
    currentStep: Annotation({
        default: () => 'init'
    }),
    error: Annotation({
        default: () => null
    }),
    completed: Annotation({
        default: () => false
    })
});
/**
 * Buyer Agent Class
 */
export class BuyerAgent {
    graph;
    llm;
    a2aClient;
    discoveryService;
    x402Service;
    agentId;
    constructor(agentId, config) {
        this.agentId = agentId;
        // Initialize LLM
        this.llm = new ChatGroq({
            apiKey: config?.groqApiKey || process.env.GROQ_API_KEY,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });
        // Initialize services
        this.a2aClient = new A2AClient({
            agentId: agentId,
            baseUrl: config?.a2aBaseUrl || process.env.A2A_BASE_URL || 'http://localhost:3000',
            auth: {
                type: 'api-key',
                apiKey: config?.a2aApiKey || process.env.BUYER_API_KEY || 'demo-buyer-key'
            },
            timeout: 30000
        });
        this.discoveryService = new DiscoveryService();
        this.x402Service = new X402Service();
        // Build state graph
        this.graph = this.buildGraph();
    }
    /**
     * Build LangGraph state machine (0.2.x API)
     */
    buildGraph() {
        const workflow = new StateGraph(BuyerState);
        // Add nodes
        workflow.addNode("discover", this.discover.bind(this));
        workflow.addNode("select", this.select.bind(this));
        workflow.addNode("negotiate", this.negotiate.bind(this));
        workflow.addNode("pay", this.pay.bind(this));
        workflow.addNode("complete", this.complete.bind(this));
        // Add edges
        workflow.addEdge(START, "discover");
        workflow.addEdge("discover", "select");
        workflow.addConditionalEdges("select", this.shouldNegotiate.bind(this));
        workflow.addConditionalEdges("negotiate", this.shouldPay.bind(this));
        workflow.addEdge("pay", "complete");
        workflow.addEdge("complete", END);
        return workflow.compile();
    }
    /**
     * Node: Discover products from marketplace
     */
    async discover(state) {
        console.log("\n🔍 [DISCOVER] Searching for products...");
        console.log(`   Request: "${state.userRequest}"`);
        try {
            // Discover seller agents with marketplace capability
            const sellerAgents = await this.discoveryService.discoverByCapability('marketplace_seller');
            console.log(`   Found ${sellerAgents.length} seller agents`);
            // For MVP: Create sample products
            // In production: Query each seller for their listings
            const products = [{
                    id: "product-1",
                    title: "MacBook Pro 2021 14\"",
                    description: "Like-new MacBook Pro with M1 Pro chip",
                    price: 1500,
                    currency: "HBAR",
                    condition: "like-new",
                    category: "electronics",
                    sellerAgentId: sellerAgents[0]?.agentId || "seller-1",
                }];
            return {
                discoveredProducts: products,
                currentStep: 'discover'
            };
        }
        catch (error) {
            console.error("   ❌ Discovery failed:", error.message);
            return {
                error: error.message,
                currentStep: 'discover'
            };
        }
    }
    /**
     * Node: Select best product using LLM
     */
    async select(state) {
        console.log("\n🤔 [SELECT] Evaluating products...");
        if (state.discoveredProducts.length === 0) {
            return {
                error: "No products found",
                currentStep: 'select'
            };
        }
        // For MVP: Select first product
        // In production: Use LLM to evaluate all products
        const selected = state.discoveredProducts[0];
        console.log(`   ✅ Selected: ${selected.title} - ${selected.price} ${selected.currency}`);
        return {
            selectedProduct: selected,
            currentStep: 'select'
        };
    }
    /**
     * Node: Negotiate price with seller
     */
    async negotiate(state) {
        console.log("\n💬 [NEGOTIATE] Starting negotiation...");
        if (!state.selectedProduct) {
            return { error: "No product selected" };
        }
        const product = state.selectedProduct;
        const offer = state.budget || product.price * 0.9; // Offer 90% of asking price
        console.log(`   Offering: ${offer} ${product.currency} (asking: ${product.price})`);
        try {
            // Send negotiation message via A2A
            const message = {
                role: "user",
                parts: [{
                        kind: "text",
                        text: `I want to buy ${product.title} for ${offer} ${product.currency}`
                    }],
                metadata: {
                    negotiation: {
                        listingId: product.id,
                        offer: offer,
                        buyerId: this.agentId
                    }
                }
            };
            const task = await this.a2aClient.sendMessage(product.sellerAgentId || "seller-1", message);
            console.log(`   ✅ Negotiation initiated, task: ${task.id}`);
            // For MVP: Accept offer immediately
            // In production: Wait for seller response and handle counter-offers
            return {
                agreedPrice: offer,
                negotiationHistory: [`Offered ${offer}, accepted`],
                currentStep: 'negotiate'
            };
        }
        catch (error) {
            console.error("   ❌ Negotiation failed:", error.message);
            return {
                error: error.message,
                currentStep: 'negotiate'
            };
        }
    }
    /**
     * Node: Execute payment via x402
     */
    async pay(state) {
        console.log("\n💰 [PAY] Executing payment...");
        if (!state.selectedProduct || !state.agreedPrice) {
            return { error: "Missing payment details" };
        }
        try {
            // Execute x402 payment
            const paymentId = await this.x402Service.sendPayment(state.selectedProduct.sellerAddress || process.env.SELLER_ACCOUNT_ID || "0.0.12345", state.agreedPrice, `Payment for ${state.selectedProduct.title}`);
            console.log(`   ✅ Payment successful: ${paymentId}`);
            return {
                paymentId: paymentId,
                currentStep: 'pay'
            };
        }
        catch (error) {
            console.error("   ❌ Payment failed:", error.message);
            return {
                error: error.message,
                currentStep: 'pay'
            };
        }
    }
    /**
     * Node: Complete transaction
     */
    async complete(state) {
        console.log("\n✅ [COMPLETE] Transaction completed!");
        return {
            completed: true,
            currentStep: 'complete'
        };
    }
    /**
     * Conditional: Should we negotiate?
     */
    shouldNegotiate(state) {
        if (state.error)
            return END;
        if (!state.selectedProduct)
            return END;
        return "negotiate";
    }
    /**
     * Conditional: Should we pay?
     */
    shouldPay(state) {
        if (state.error)
            return END;
        if (!state.agreedPrice)
            return "select"; // Try another product
        return "pay";
    }
    /**
     * Invoke the buyer agent
     */
    async invoke(userRequest, budget) {
        console.log("🚀 Starting Buyer Agent...");
        console.log(`   Request: ${userRequest}`);
        console.log(`   Budget: ${budget || 'Not specified'}`);
        const result = await this.graph.invoke({
            userRequest,
            budget
        });
        console.log("\n📊 Final Result:", result);
        return result;
    }
}
/**
 * Helper: Create buyer agent instance
 */
export function createBuyerAgent(agentId = "buyer-agent-1") {
    return new BuyerAgent(agentId);
}
//# sourceMappingURL=buyerAgent_clean.js.map