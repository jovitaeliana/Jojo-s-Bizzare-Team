/**
 * Buyer Agent - LangGraph Implementation
 *
 * Autonomous buyer agent that:
 * 1. Discovers products using ERC-8004 and discovery service
 * 2. Selects best product using LLM
 * 3. Negotiates with seller via A2A protocol
 * 4. Executes payment via x402 (Hedera payment protocol)
 * 5. Confirms delivery and completes transaction
 */
import { StateGraph, END, Annotation, START } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { DiscoveryService } from "../services/discovery.js";
import { A2AClient } from "../services/a2aClient.js";
import { X402Service } from "../services/x402.js";
import { EscrowService } from "../services/escrow.js";
import { hcsService } from "../services/hcs.js";
import { createProductSelectionPrompt, createNegotiationPrompt, } from "./prompts/buyerPrompts.js";
/**
 * Buyer Agent State (LangGraph 0.2.x API)
 * Note: All fields with defaults need explicit reducers
 */
const BuyerState = Annotation.Root({
    userRequest: Annotation(),
    userBudget: Annotation(),
    discoveredProducts: Annotation({
        reducer: (x, y) => y || x,
        default: () => []
    }),
    selectedProduct: Annotation({
        reducer: (x, y) => y !== undefined ? y : x,
        default: () => null
    }),
    negotiationHistory: Annotation({
        reducer: (x, y) => [...x, ...y],
        default: () => []
    }),
    // Track products we already tried to avoid infinite reselection
    excludedProductIds: Annotation({
        reducer: (x, y) => (y ? Array.from(new Set([...(x || []), ...y])) : x || []),
        default: () => []
    }),
    offerAccepted: Annotation({
        reducer: (x, y) => y,
        default: () => false
    }),
    paymentId: Annotation({
        reducer: (x, y) => y !== undefined ? y : x,
        default: () => null
    }),
    escrowId: Annotation({
        reducer: (x, y) => y !== undefined ? y : x,
        default: () => null
    }),
    currentStep: Annotation({
        reducer: (x, y) => y,
        default: () => 'init'
    }),
    error: Annotation({
        reducer: (x, y) => y !== undefined ? y : x,
        default: () => null
    }),
    finalResult: Annotation({
        reducer: (x, y) => y !== undefined ? y : x,
        default: () => null
    })
});
/**
 * Buyer Agent Class
 */
export class BuyerAgent {
    llm;
    graph;
    a2aClient;
    discoveryService;
    x402Service;
    escrowService;
    agentId;
    x402Initialized = false;
    // Pre-created tools for LangSmith tracing
    x402Tool;
    discoveryTool;
    a2aTool;
    constructor(agentId, apiKey) {
        this.agentId = agentId;
        // Initialize Groq LLM
        this.llm = new ChatGroq({
            apiKey: apiKey || process.env.GROQ_API_KEY,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });
        // Initialize services with correct constructor signatures
        this.a2aClient = new A2AClient({
            agentId: agentId,
            baseUrl: process.env.A2A_BASE_URL || 'http://localhost:3000',
            auth: {
                type: 'api-key',
                apiKey: process.env.BUYER_API_KEY || 'demo-buyer-key'
            },
            timeout: 30000
        });
        this.discoveryService = new DiscoveryService();
        this.x402Service = new X402Service();
        this.escrowService = new EscrowService();
        // Create tools once for better LangSmith tracing
        this.x402Tool = this.createX402PaymentTool();
        this.discoveryTool = this.createDiscoveryTool();
        this.a2aTool = this.createA2ATool();
        // Build state graph
        this.graph = this.buildGraph();
    }
    /**
     * Initialize payment service with buyer credentials
     */
    async initializePayments(accountId, privateKey) {
        await this.x402Service.initialize(accountId, privateKey);
        console.log("✅ x402 service initialized for buyer agent");
        this.x402Initialized = true;
    }
    /**
     * Create x402 payment tool for LangSmith tracing
     */
    createX402PaymentTool() {
        const x402Service = this.x402Service;
        const self = this;
        return tool(async ({ sellerAddress, amount, currency, productId }) => {
            // Lazy-initialize x402 from environment if not already initialized
            if (!self.x402Initialized) {
                const buyerId = process.env.BUYER_ACCOUNT_ID;
                const buyerKey = process.env.BUYER_PRIVATE_KEY;
                if (buyerId && buyerKey) {
                    console.log("   🔄 x402 not initialized; initializing from environment...");
                    await x402Service.initialize(buyerId, buyerKey);
                    self.x402Initialized = true;
                    console.log("   ✅ x402 service initialized (lazy)");
                }
                else {
                    throw new Error("x402 service not initialized and BUYER_ACCOUNT_ID/BUYER_PRIVATE_KEY not set");
                }
            }
            // Basic validation for Hedera account format
            if (typeof sellerAddress !== 'string' || !sellerAddress.includes('.')) {
                console.warn(`   ⚠️ sellerAddress '${sellerAddress}' does not look like a Hedera account ID (e.g., 0.0.1234)`);
            }
            console.log(`\n💰 [x402] Processing payment:`);
            console.log(`   To: ${sellerAddress}`);
            console.log(`   Amount: ${amount} ${currency}`);
            console.log(`   Product: ${productId}`);
            try {
                const paymentId = await x402Service.processAgentPayment(sellerAddress, amount, currency, productId);
                console.log(`   ✅ x402 payment processed: ${paymentId}`);
                console.log(`   🔗 View on HashScan: https://hashscan.io/testnet/transaction/${paymentId}`);
                const result = {
                    success: true,
                    paymentId: paymentId,
                    transactionUrl: `https://hashscan.io/testnet/transaction/${paymentId}`,
                    amount: amount,
                    currency: currency,
                    seller: sellerAddress
                };
                console.log(`   📤 Tool returning:`, JSON.stringify(result));
                return result;
            }
            catch (error) {
                console.log(`   ❌ Payment failed: ${error.message}`);
                const errorResult = {
                    success: false,
                    error: error.message,
                    paymentId: null
                };
                console.log(`   📤 Tool returning error:`, JSON.stringify(errorResult));
                return errorResult;
            }
        }, {
            name: "x402_payment",
            description: "Execute x402 payment on Hedera blockchain. This tool processes secure on-chain payments using the x402 protocol.",
            schema: z.object({
                sellerAddress: z.string().describe("Hedera account ID of the seller (e.g., 0.0.123456)"),
                amount: z.number().describe("Payment amount in the specified currency"),
                currency: z.string().describe("Currency for payment (e.g., HBAR)"),
                productId: z.string().describe("Unique identifier of the product being purchased"),
            }),
        });
    }
    /**
     * Create discovery tool for LangSmith tracing
     */
    createDiscoveryTool() {
        const discoveryService = this.discoveryService;
        return tool(async ({ capability }) => {
            console.log(`🔍 Discovering agents with capability: ${capability}...`);
            const agents = await discoveryService.discoverByCapability(capability);
            console.log(`   📋 Found ${agents.length} seller agents`);
            return {
                agentsFound: agents.length,
                agents: agents.map(a => ({
                    agentId: a.agentId,
                    name: a.agentName || a.agentCard?.name || a.metadata?.find(m => m.key === 'agentName')?.value || 'Unknown',
                    endpoint: a.capabilities?.[0]?.endpoint || '',
                    capabilities: a.capabilities?.map(c => c.name) || [],
                })),
            };
        }, {
            name: "erc8004_discovery",
            description: "Discover agents by capability using ERC-8004 registry. This tool finds agents registered on-chain with specific capabilities.",
            schema: z.object({
                capability: z.string().describe("The capability to search for (e.g., 'sell', 'purchase')"),
            }),
        });
    }
    /**
     * Create A2A communication tool for LangSmith tracing
     */
    createA2ATool() {
        const a2aClient = this.a2aClient;
        return tool(async ({ agentId, message }) => {
            console.log(`   📤 Requesting listings from agent ${agentId}...`);
            const a2aMessage = {
                role: "user",
                parts: [{ kind: "text", text: message }],
            };
            // Use sendCustomMessage instead of sendMessage
            const task = await a2aClient.sendCustomMessage(agentId, a2aMessage);
            const result = await a2aClient.waitForTask(task.id, agentId, {
                pollInterval: 1000,
                maxAttempts: 30,
            });
            if (result.status.state === "completed" && result.status.message) {
                const response = result.status.message;
                // Get response text
                let responseText = "";
                if (response.parts && response.parts.length > 0) {
                    const part = response.parts[0];
                    if (part && typeof part === 'object' && 'text' in part) {
                        responseText = String(part.text || "");
                    }
                }
                // Get metadata (listings)
                const metadata = response.metadata || {};
                console.log(`   ✅ Received response from agent ${agentId}`);
                return {
                    success: true,
                    response: responseText,
                    metadata: JSON.stringify(metadata),
                    taskId: task.id,
                };
            }
            return {
                success: false,
                error: "No response from agent",
                response: "",
                metadata: "{}",
            };
        }, {
            name: "a2a_communication",
            description: "Send messages to other agents using A2A (Agent-to-Agent) protocol. This tool enables inter-agent communication.",
            schema: z.object({
                agentId: z.string().describe("The ID of the agent to communicate with"),
                message: z.string().describe("The message to send to the agent"),
            }),
        });
    }
    safeParseJSON(raw) {
        if (typeof raw !== 'string')
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            // Try to extract the first JSON object substring
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
    /**
     * Build LangGraph state machine (0.2.x API)
     */
    buildGraph() {
        return new StateGraph(BuyerState)
            // Add nodes
            .addNode("discover", this.discoverNode.bind(this))
            .addNode("select", this.selectNode.bind(this))
            .addNode("negotiate", this.negotiateNode.bind(this))
            .addNode("pay", this.payNode.bind(this))
            .addNode("complete", this.completeNode.bind(this))
            // Add edges - use START constant for entry point
            .addEdge(START, "discover")
            .addEdge("discover", "select")
            .addConditionalEdges("select", this.shouldNegotiate.bind(this))
            .addConditionalEdges("negotiate", this.shouldPay.bind(this))
            .addEdge("pay", "complete")
            .addEdge("complete", END)
            .compile();
    }
    /**
     * Node: Discover products
     * Now uses LangChain tools for better LangSmith tracing
     */
    async discoverNode(state) {
        console.log("\n🔍 [DISCOVER] Searching for products...");
        console.log(`   User Request: "${state.userRequest}"`);
        try {
            // Use discovery tool (for LangSmith tracing)
            const discoveryResult = await this.discoveryTool.invoke({
                capability: 'sell',
            });
            if (discoveryResult.agentsFound === 0) {
                console.log(`   ⚠️ No seller agents found`);
                return {
                    discoveredProducts: [],
                    currentStep: "discover",
                    error: null,
                };
            }
            // Query listings from each seller agent via A2A
            const products = [];
            for (const agent of discoveryResult.agents) {
                try {
                    // Use A2A tool (for LangSmith tracing)
                    const a2aResult = await this.a2aTool.invoke({
                        agentId: agent.agentId,
                        message: "Show me all available products",
                    });
                    if (a2aResult.success) {
                        // Parse listings from metadata (not response text)
                        const metadata = this.safeParseJSON(a2aResult.metadata || "{}");
                        const listingsData = metadata?.listings || [];
                        console.log(`   ✅ Received ${listingsData.length} listings from agent ${agent.agentId}`);
                        // Add seller info to each listing
                        products.push(...listingsData.map((l) => ({
                            ...l,
                            sellerAgentId: agent.agentId,
                            // Use seller's Hedera account ID, fallback to env SELLER_ACCOUNT_ID
                            sellerAddress: l.sellerAddress || process.env.SELLER_ACCOUNT_ID || "0.0.7174705",
                        })));
                    }
                }
                catch (error) {
                    console.warn(`   ⚠️ Failed to get listings from agent ${agent.agentId}:`, error.message);
                    // Continue with other agents
                }
            }
            console.log(`   ✅ Total products discovered: ${products.length}`);
            // Log discovery to HCS
            if (hcsService.isInitialized()) {
                await hcsService.logDiscovery(this.agentId, 'marketplace_seller', discoveryResult.agents.map((a) => ({
                    agentId: a.agentId,
                    name: a.name,
                    endpoint: a.endpoint,
                })));
            }
            return {
                discoveredProducts: products,
                currentStep: "discover",
                error: null,
            };
        }
        catch (error) {
            console.error("   ❌ Discovery failed:", error.message);
            return {
                discoveredProducts: [],
                currentStep: "discover",
                error: error.message,
            };
        }
    }
    /**
     * Node: Select best product using LLM
     */
    async selectNode(state) {
        console.log("\n🤔 [SELECT] Evaluating products with LLM...");
        if (state.discoveredProducts.length === 0) {
            console.log("   ❌ No products to evaluate");
            return {
                selectedProduct: null,
                currentStep: "select",
                error: "No products found",
            };
        }
        console.log(`   Products to evaluate (${state.discoveredProducts.length}):`);
        state.discoveredProducts.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.title} - ${p.price} ${p.currency}`);
            console.log(`      ID: ${p.id}`);
            console.log(`      Description: ${p.description?.substring(0, 80)}...`);
        });
        try {
            // Create prompt for LLM
            const prompt = createProductSelectionPrompt(state.userRequest, state.discoveredProducts);
            // Get LLM decision
            const response = await this.llm.invoke(prompt);
            const decision = this.safeParseJSON(response.content) || {
                reasoning: 'Fallback selection',
                confidence: 0.5,
                selectedProductId: state.discoveredProducts[0]?.id,
            };
            console.log(`   Decision: ${decision.reasoning}`);
            console.log(`   Confidence: ${decision.confidence}`);
            if (!decision.selectedProductId) {
                console.log("   ❌ No suitable product found");
                return {
                    selectedProduct: null,
                    currentStep: "select",
                    error: "No suitable product found",
                };
            }
            // Exclude previously tried products to prevent infinite loops
            const excluded = new Set(state.excludedProductIds || []);
            const candidates = state.discoveredProducts.filter(p => !excluded.has(p.id));
            const selectedProduct = candidates.find(p => p.id === decision.selectedProductId)
                || candidates[0];
            if (!selectedProduct) {
                console.log("   ❌ No suitable product left to try");
                return {
                    selectedProduct: null,
                    currentStep: "select",
                    error: "No suitable product available",
                };
            }
            console.log(`   ✅ Selected: ${selectedProduct.title}`);
            console.log(`   Price: ${selectedProduct.price} ${selectedProduct.currency}`);
            // Log product selection to HCS
            if (hcsService.isInitialized()) {
                await hcsService.logProductSelection(this.agentId, selectedProduct);
            }
            return {
                selectedProduct,
                currentStep: "select",
                error: null,
            };
        }
        catch (error) {
            console.error("   ❌ Selection failed:", error.message);
            return {
                selectedProduct: null,
                currentStep: "select",
                error: error.message,
            };
        }
    }
    /**
     * Node: Negotiate with seller via A2A
     */
    async negotiateNode(state) {
        console.log("\n💬 [NEGOTIATE] Negotiating with seller...");
        if (!state.selectedProduct) {
            return {
                offerAccepted: false,
                currentStep: "negotiate",
                error: "No product selected",
            };
        }
        try {
            // Create negotiation prompt
            const prompt = createNegotiationPrompt(state.selectedProduct, state.userBudget);
            // Get LLM decision
            const response = await this.llm.invoke(prompt);
            const decision = this.safeParseJSON(response.content) || {
                action: 'accept',
                reasoning: 'Fallback accept at listed price',
                message: `I can accept ${state.selectedProduct.price} ${state.selectedProduct.currency}`,
                offerPrice: state.selectedProduct.price,
            };
            console.log(`   Action: ${decision.action}`);
            console.log(`   Reasoning: ${decision.reasoning}`);
            if (decision.action === "reject") {
                console.log("   ❌ Rejecting product, looking for alternatives");
                return {
                    selectedProduct: null, // Trigger re-selection
                    offerAccepted: false,
                    currentStep: "negotiate",
                    error: null,
                };
            }
            // Send offer to seller via A2A
            const offerMessage = {
                role: "user",
                parts: [
                    {
                        kind: "text",
                        text: decision.message,
                    },
                ],
                metadata: {
                    type: "purchase_offer",
                    productId: state.selectedProduct.id,
                    offerPrice: decision.offerPrice,
                    currency: state.selectedProduct.currency,
                }
            };
            console.log(`   📤 Sending offer to seller agent ${state.selectedProduct.sellerAgentId}`);
            console.log(`   Offer: ${decision.offerPrice} ${state.selectedProduct.currency}`);
            // Send message via A2A client (custom message with metadata)
            const task = await this.a2aClient.sendCustomMessage(state.selectedProduct.sellerAgentId || "28", offerMessage);
            // Wait for seller response
            console.log(`   ⏳ Waiting for seller response...`);
            const result = await this.a2aClient.waitForTask(task.id, state.selectedProduct.sellerAgentId || "28", { pollInterval: 1000, maxAttempts: 30 });
            if (result.status.state === "completed" && result.status.message) {
                const sellerResponse = result.status.message;
                console.log(`   📥 Seller response: ${sellerResponse.parts[0]?.text}`);
                const meta = sellerResponse.metadata || {};
                const text = (sellerResponse.parts?.[0]?.text || "").toLowerCase();
                // 1) Immediate accept of buyer's offer
                if (meta.accepted === true || meta.action === 'accept') {
                    console.log("   ✅ Offer accepted!");
                    // Log negotiation success to HCS
                    if (hcsService.isInitialized()) {
                        await hcsService.logNegotiation(this.agentId, 1, { price: decision.offerPrice, message: decision.message }, undefined, true);
                    }
                    return {
                        offerAccepted: true,
                        negotiationHistory: [...(state.negotiationHistory || []), { offer: decision, response: sellerResponse }],
                        currentStep: "negotiate",
                        error: null,
                    };
                }
                // 2) Counter-offer path: accept if within budget
                if (meta.action === 'counter' && typeof meta.counterOffer === 'number') {
                    const counter = meta.counterOffer;
                    if (!state.userBudget || counter <= state.userBudget) {
                        console.log(`   👍 Counter ${counter} is within budget. Accepting counter.`);
                        // Log negotiation with counter-offer to HCS
                        if (hcsService.isInitialized()) {
                            await hcsService.logNegotiation(this.agentId, 1, { price: decision.offerPrice, message: decision.message }, { price: counter }, true);
                        }
                        // Use counter price for payment
                        const updatedProduct = {
                            ...state.selectedProduct,
                            price: counter,
                        };
                        return {
                            selectedProduct: updatedProduct,
                            offerAccepted: true,
                            negotiationHistory: [...(state.negotiationHistory || []), { offer: decision, response: sellerResponse }],
                            currentStep: "negotiate",
                            error: null,
                        };
                    }
                    console.log(`   ❌ Counter ${counter} exceeds budget. Looking for alternatives.`);
                }
                // 2b) Heuristic acceptance when metadata is missing but text implies acceptance
                if (!sellerResponse.metadata) {
                    const impliesAccept = text.includes('i accept') ||
                        text.includes('accept your offer') ||
                        text.includes('proceed with payment') ||
                        text.includes('payment details');
                    if (impliesAccept) {
                        console.log("   ✅ Seller text implies acceptance. Proceeding.");
                        return {
                            offerAccepted: true,
                            negotiationHistory: [...(state.negotiationHistory || []), { offer: decision, response: sellerResponse }],
                            currentStep: "negotiate",
                            error: null,
                        };
                    }
                    // Attempt to detect a counter price in text, e.g., "I can accept 1450 HBAR"
                    const counterMatch = text.match(/(\d+)\s*hbar/);
                    if (counterMatch) {
                        const counter = parseInt(counterMatch[1], 10);
                        if (!isNaN(counter)) {
                            if (!state.userBudget || counter <= state.userBudget) {
                                console.log(`   👍 Parsed counter ${counter} from text. Accepting.`);
                                const updatedProduct = { ...state.selectedProduct, price: counter };
                                return {
                                    selectedProduct: updatedProduct,
                                    offerAccepted: true,
                                    negotiationHistory: [...(state.negotiationHistory || []), { offer: decision, response: sellerResponse }],
                                    currentStep: "negotiate",
                                    error: null,
                                };
                            }
                        }
                    }
                }
                // 3) Rejection or unaffordable counter → try another product
                console.log("   ❌ Offer rejected, trying another product");
                return {
                    selectedProduct: null, // Trigger re-selection
                    offerAccepted: false,
                    negotiationHistory: [...(state.negotiationHistory || []), { offer: decision, response: sellerResponse }],
                    currentStep: "negotiate",
                    error: null,
                    excludedProductIds: [state.selectedProduct.id],
                };
            }
            console.log("   ⚠️ No response from seller");
            return {
                offerAccepted: false,
                currentStep: "negotiate",
                error: "No response from seller",
                excludedProductIds: [state.selectedProduct.id],
            };
        }
        catch (error) {
            console.error("   ❌ Negotiation failed:", error.message);
            return {
                offerAccepted: false,
                currentStep: "negotiate",
                error: error.message,
            };
        }
    }
    /**
     * Node: Execute payment via x402 (hackathon requirement)
     * Now uses LangChain tool for better LangSmith tracing
     */
    async payNode(state) {
        console.log("\n💰 [PAY] Executing payment via x402...");
        if (!state.selectedProduct || !state.offerAccepted) {
            return {
                paymentId: null,
                currentStep: "pay",
                error: "Cannot pay: no accepted offer",
            };
        }
        try {
            const sellerAddress = state.selectedProduct.sellerAddress;
            console.log(`\n🔍 DEBUG payNode:`);
            console.log(`   selectedProduct:`, JSON.stringify(state.selectedProduct, null, 2));
            console.log(`   sellerAddress: "${sellerAddress}" (type: ${typeof sellerAddress})`);
            if (!sellerAddress) {
                throw new Error("Seller address not found in selectedProduct");
            }
            if (!sellerAddress.match(/^0\.0\.\d+$/)) {
                throw new Error(`Invalid Hedera account ID format: "${sellerAddress}" - must be 0.0.xxxxx`);
            }
            // Invoke x402 payment tool (for LangSmith tracing)
            console.log(`   📞 Calling x402 payment tool with validated address: ${sellerAddress}`);
            const result = await this.x402Tool.invoke({
                sellerAddress,
                amount: state.selectedProduct.price,
                currency: state.selectedProduct.currency,
                productId: state.selectedProduct.id,
            });
            console.log(`   📥 Tool result received:`, JSON.stringify(result));
            // Log payment to HCS
            if (hcsService.isInitialized()) {
                await hcsService.logPayment(this.agentId, result.paymentId, state.selectedProduct.price, state.selectedProduct.currency, sellerAddress, result.success);
            }
            return {
                paymentId: result.paymentId,
                escrowId: null,
                currentStep: "pay",
                error: null,
            };
        }
        catch (error) {
            console.error("   ❌ x402 payment failed:", error.message);
            // Log payment failure to HCS
            if (hcsService.isInitialized()) {
                await hcsService.logError(this.agentId, `Payment failed: ${error.message}`, {
                    product: state.selectedProduct?.id,
                    seller: state.selectedProduct?.sellerAddress,
                });
            }
            return {
                paymentId: null,
                escrowId: null,
                currentStep: "pay",
                error: `x402 payment failed: ${error.message}`,
            };
        }
    }
    /**
     * Node: Complete purchase
     */
    async completeNode(state) {
        console.log("\n✅ [COMPLETE] Finalizing purchase...");
        if (!state.paymentId) {
            return {
                currentStep: "complete",
                error: "Cannot complete: no payment",
                finalResult: null,
            };
        }
        try {
            // In a real implementation, we would:
            // 1. Wait for shipment confirmation from seller
            // 2. Verify delivery
            // 3. Log completion to HCS (Hedera Consensus Service)
            console.log(`   ✅ Purchase complete!`);
            console.log(`   Product: ${state.selectedProduct?.title}`);
            console.log(`   Price: ${state.selectedProduct?.price} ${state.selectedProduct?.currency}`);
            console.log(`   Payment ID: ${state.paymentId}`);
            // Log transaction completion to HCS
            if (hcsService.isInitialized()) {
                await hcsService.logTransactionComplete(this.agentId, state.paymentId, {
                    product: {
                        id: state.selectedProduct?.id,
                        title: state.selectedProduct?.title,
                        price: state.selectedProduct?.price,
                        currency: state.selectedProduct?.currency,
                    },
                    seller: state.selectedProduct?.sellerAddress,
                    paymentId: state.paymentId,
                });
            }
            return {
                currentStep: "complete",
                error: null,
                finalResult: {
                    success: true,
                    product: state.selectedProduct,
                    paymentId: state.paymentId,
                    escrowId: state.escrowId,
                },
            };
        }
        catch (error) {
            console.error("   ❌ Completion failed:", error.message);
            return {
                currentStep: "complete",
                error: error.message,
                finalResult: null,
            };
        }
    }
    /**
     * Conditional edge: Should negotiate?
     */
    shouldNegotiate(state) {
        if (state.selectedProduct) {
            return "negotiate";
        }
        return END;
    }
    /**
     * Conditional edge: Should pay?
     */
    shouldPay(state) {
        if (state.offerAccepted) {
            return "pay";
        }
        if (state.selectedProduct === null) {
            return "select"; // Try another product
        }
        return END;
    }
    /**
     * Execute buyer agent workflow
     */
    async executePurchase(userRequest, userBudget) {
        console.log("\n" + "=".repeat(60));
        console.log("🤖 BUYER AGENT - Starting Purchase Workflow");
        console.log("=".repeat(60));
        console.log(`Request: "${userRequest}"`);
        if (userBudget) {
            console.log(`Budget: ${userBudget} HBAR`);
        }
        console.log("=".repeat(60));
        const initialState = {
            userRequest,
            userBudget,
            discoveredProducts: [],
            selectedProduct: null,
            negotiationHistory: [],
            offerAccepted: false,
            paymentId: null,
            escrowId: null,
            currentStep: "start",
            error: null,
            finalResult: null,
            excludedProductIds: [],
        };
        try {
            const result = await this.graph.invoke(initialState);
            console.log("\n" + "=".repeat(60));
            console.log("🎉 BUYER AGENT - Workflow Complete");
            console.log("=".repeat(60));
            console.log("Final State:", JSON.stringify(result.finalResult, null, 2));
            console.log("=".repeat(60) + "\n");
            return result;
        }
        catch (error) {
            console.error("\n❌ BUYER AGENT - Workflow Failed:", error.message);
            throw error;
        }
    }
}
// Export singleton instance
let buyerAgentInstance = null;
export async function getBuyerAgent() {
    if (!buyerAgentInstance) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("GROQ_API_KEY not found in environment variables");
        }
        const buyerAccountId = process.env.BUYER_ACCOUNT_ID;
        const buyerPrivateKey = process.env.BUYER_PRIVATE_KEY;
        if (!buyerAccountId || !buyerPrivateKey) {
            throw new Error("BUYER_ACCOUNT_ID or BUYER_PRIVATE_KEY not found in environment variables");
        }
        console.log("✅ Creating buyer agent instance");
        buyerAgentInstance = new BuyerAgent("buyer-agent-1", apiKey);
        await buyerAgentInstance.initializePayments(buyerAccountId, buyerPrivateKey);
    }
    return buyerAgentInstance;
}
//# sourceMappingURL=buyerAgent.js.map