/**
 * Hedera Agentic Marketplace - Backend Server
 *
 * Main entry point for the Express server that provides:
 * - A2A protocol endpoints for agent-to-agent communication
 * - AgentCard discovery endpoints
 * - Escrow contract interaction APIs
 * - ERC-8004 agent discovery integration
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import agentCardRouter from "./api/agentCard.js";
import { a2aServer, createA2ARouter } from "./api/a2aServer.js";
import { getSellerAgent } from "./agents/sellerAgent.js";
import { sellingAgentService } from "./services/sellingAgent.js";
dotenv.config();
// Initialize seller agent and register message handler
try {
    const sellerAgent = getSellerAgent();
    const sellerAgentId = process.env.SELLER_AGENT_ID || "28";
    a2aServer.registerMessageHandler(sellerAgentId, async (message, agentId) => {
        return await sellerAgent.handleBuyerMessage(message, agentId);
    });
    console.log(`✅ Seller agent registered for agent ID: ${sellerAgentId}`);
    // Seed a default listing so buyer offers don't fail with "Product not found"
    // This keeps state in the same process as the A2A handler
    (async () => {
        try {
            const listingId = "product-1";
            const existing = sellingAgentService.getListing(listingId);
            if (!existing) {
                await sellingAgentService.createListingWithId(listingId, 'MacBook Pro 2021 14"', 'Like-new MacBook Pro with M1 Pro chip, 16GB RAM, 512GB SSD', 100, 'HBAR', undefined, 'like-new', 'electronics');
            }
            // Activate and attach seller address without on-chain registration during dev
            if (process.env.SELLER_ACCOUNT_ID) {
                await sellingAgentService.updateListing(listingId, {
                    status: 'active',
                    sellerAddress: process.env.SELLER_ACCOUNT_ID,
                });
                console.log(`🧪 Bootstrapped listing ${listingId} for seller ${process.env.SELLER_ACCOUNT_ID}`);
                console.log(`   💻 Product: MacBook Pro 2021 14" - 100 HBAR`);
            }
            else {
                console.warn('⚠️ SELLER_ACCOUNT_ID not set; listing seeded but no seller address attached');
            }
        }
        catch (e) {
            console.warn('⚠️ Failed to bootstrap default listing:', e.message);
        }
    })();
}
catch (error) {
    console.error("⚠️ Failed to initialize seller agent:", error.message);
}
const app = express();
const PORT = process.env.PORT || 3000;
// ========================================
// Middleware
// ========================================
// CORS configuration
app.use(cors({
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Agent-API-Key"],
    credentials: true
}));
// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});
// ========================================
// Static Files
// ========================================
// Serve public directory for agent cards and assets
app.use(express.static("public"));
// ========================================
// API Routes
// ========================================
// AgentCard endpoints
app.use(agentCardRouter);
// A2A JSON-RPC endpoints
const a2aRouter = createA2ARouter(a2aServer);
app.use(a2aRouter);
// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        services: {
            erc8004: "connected",
            escrow: "deployed",
            agentCards: "available"
        }
    });
});
// API info endpoint
app.get("/api", (req, res) => {
    res.json({
        name: "Hedera Agentic Marketplace API",
        version: "1.0.0",
        description: "Backend API for autonomous agent-to-agent marketplace on Hedera",
        endpoints: {
            agentCards: {
                wellKnown: "/.well-known/agent-card.json",
                buyer: "/agents/buyer/card.json",
                seller: "/agents/seller/card.json",
                list: "/agents/list"
            },
            a2a: {
                buyer: "/api/a2a/27",
                seller: "/api/a2a/28",
                methods: ["message/send", "tasks/get", "tasks/cancel", "tasks/list"]
            },
            health: "/health",
            api: "/api"
        },
        protocols: {
            a2a: "0.3.0",
            erc8004: "enabled",
            x402: "planned"
        },
        network: {
            name: "Hedera Testnet",
            chainId: 296,
            rpcUrl: process.env.JSON_RPC_URL
        }
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.path} not found`,
        availableEndpoints: [
            "GET /.well-known/agent-card.json",
            "GET /agents/buyer/card.json",
            "GET /agents/seller/card.json",
            "GET /agents/list",
            "POST /api/a2a/:agentId",
            "GET /health",
            "GET /api"
        ]
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error("❌ Server error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});
// ========================================
// Server Startup
// ========================================
app.listen(PORT, () => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 Hedera Agentic Marketplace - Backend Server");
    console.log("=".repeat(60));
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`📍 Network: Hedera Testnet (Chain ID: 296)`);
    console.log(`📍 RPC URL: ${process.env.JSON_RPC_URL}`);
    console.log("\n📋 Available Endpoints:");
    console.log(`   ✅ GET  /.well-known/agent-card.json`);
    console.log(`   ✅ GET  /agents/buyer/card.json`);
    console.log(`   ✅ GET  /agents/seller/card.json`);
    console.log(`   ✅ GET  /agents/list`);
    console.log(`   ✅ POST /api/a2a/:agentId`);
    console.log(`   ✅ GET  /health`);
    console.log(`   ✅ GET  /api`);
    console.log("\n🔗 Agent Discovery:");
    console.log(`   Buyer:  http://localhost:${PORT}/agents/buyer/card.json`);
    console.log(`   Seller: http://localhost:${PORT}/agents/seller/card.json`);
    console.log("\n💬 A2A Communication:");
    console.log(`   Buyer:  POST http://localhost:${PORT}/api/a2a/27`);
    console.log(`   Seller: POST http://localhost:${PORT}/api/a2a/28`);
    console.log(`   Methods: message/send, tasks/get, tasks/cancel, tasks/list`);
    console.log("\n🎯 ERC-8004 Integration:");
    console.log(`   Registry: 0x4c74ebd72921d537159ed2053f46c12a7d8e5923`);
    console.log(`   Buyer Agent ID: ${process.env.BUYER_AGENT_ID || "Not registered"}`);
    console.log(`   Seller Agent ID: ${process.env.SELLER_AGENT_ID || "Not registered"}`);
    console.log("\n" + "=".repeat(60));
    console.log("✨ Server ready to accept requests!");
    console.log("=".repeat(60) + "\n");
});
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("\n🛑 SIGTERM received, shutting down gracefully...");
    process.exit(0);
});
process.on("SIGINT", () => {
    console.log("\n🛑 SIGINT received, shutting down gracefully...");
    process.exit(0);
});
export default app;
//# sourceMappingURL=index.js.map