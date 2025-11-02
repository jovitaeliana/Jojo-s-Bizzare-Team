/**
 * Seller Agent - LangGraph Implementation (0.2.x API)
 *
 * Autonomous seller agent that:
 * 1. Creates and publishes product listings
 * 2. Listens for buyer offers via A2A protocol
 * 3. Evaluates offers using LLM
 * 4. Accepts/rejects/counters offers
 * 5. Confirms shipment after payment
 */
import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { X402Service } from "../services/x402.js";
/**
 * Seller Agent State (LangGraph 0.2.x API)
 */
const SellerState = Annotation.Root({
    listing: Annotation({
        default: () => null
    }),
    incomingOffers: Annotation({
        reducer: (x, y) => [...x, ...y],
        default: () => []
    }),
    currentOffer: Annotation({
        default: () => null
    }),
    offerEvaluation: Annotation({
        default: () => null
    }),
    paymentReceived: Annotation({
        default: () => false
    }),
    shipmentConfirmed: Annotation({
        default: () => false
    }),
    currentStep: Annotation({
        default: () => 'init'
    }),
    error: Annotation({
        default: () => null
    }),
    finalResult: Annotation({
        default: () => null
    })
});
/**
 * Seller Agent Class
 */
export class SellerAgent {
    llm;
    graph;
    x402Service;
    agentId;
    constructor(agentId, apiKey) {
        this.agentId = agentId;
        // Initialize Groq LLM
        this.llm = new ChatGroq({
            apiKey: apiKey || process.env.GROQ_API_KEY,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });
        // Initialize services
        this.x402Service = new X402Service();
        // Build state graph
        this.graph = this.buildGraph();
    }
    /**
     * Build LangGraph state machine (0.2.x API)
     */
    buildGraph() {
        const workflow = new StateGraph(SellerState);
        // Add nodes
        workflow.addNode("list", this.listNode.bind(this));
        workflow.addNode("wait", this.waitNode.bind(this));
        workflow.addNode("evaluate", this.evaluateNode.bind(this));
        workflow.addNode("accept", this.acceptNode.bind(this));
        workflow.addNode("ship", this.shipNode.bind(this));
        // Add edges
        workflow.addEdge("list", "wait");
        workflow.addConditionalEdges("wait", this.hasOffer.bind(this), {
            evaluate: "evaluate",
            wait: "wait",
        });
        workflow.addConditionalEdges("evaluate", this.shouldAccept.bind(this), {
            accept: "accept",
            wait: "wait", // Rejected, wait for next offer
        });
        workflow.addConditionalEdges("accept", this.hasPayment.bind(this), {
            ship: "ship",
            wait: "wait",
        });
        workflow.addEdge("ship", END);
        // Set entry point
        workflow.setEntryPoint("list");
        return workflow.compile();
    }
    // NOTE: Node methods need to be updated with SellerStateType
    // This is a template - full implementation should match original logic
    async listNode(state) {
        // Implementation from original
        return { currentStep: 'list' };
    }
    async waitNode(state) {
        // Implementation from original
        return { currentStep: 'wait' };
    }
    async evaluateNode(state) {
        // Implementation from original
        return { currentStep: 'evaluate' };
    }
    async acceptNode(state) {
        // Implementation from original
        return { currentStep: 'accept' };
    }
    async shipNode(state) {
        // Implementation from original
        return { currentStep: 'ship' };
    }
    hasOffer(state) {
        return state.currentOffer ? 'evaluate' : 'wait';
    }
    shouldAccept(state) {
        return state.offerEvaluation?.acceptable ? 'accept' : 'wait';
    }
    hasPayment(state) {
        return state.paymentReceived ? 'ship' : 'wait';
    }
    /**
     * Invoke the seller agent
     */
    async invoke(input) {
        return await this.graph.invoke(input);
    }
    /**
     * Handle incoming A2A message (offer from buyer)
     */
    async handleOffer(message) {
        // Extract offer from message
        const offerData = message.metadata?.negotiation;
        if (!offerData) {
            throw new Error("No offer data in message");
        }
        const offer = {
            buyerId: offerData.buyerId,
            listingId: offerData.listingId,
            offerPrice: offerData.offer,
            timestamp: Date.now(),
        };
        // Process through state machine
        const result = await this.graph.invoke({
            incomingOffers: [offer],
            currentOffer: offer,
        });
        // Return response message
        const response = {
            role: "agent",
            parts: [{
                    kind: "text",
                    text: result.offerEvaluation?.message || "Offer processed"
                }],
            metadata: {
                negotiation: {
                    status: result.offerEvaluation?.action,
                    counterOffer: result.offerEvaluation?.counterOffer,
                    reasoning: result.offerEvaluation?.reasoning
                }
            }
        };
        return response;
    }
}
//# sourceMappingURL=sellerAgentFixed.js.map