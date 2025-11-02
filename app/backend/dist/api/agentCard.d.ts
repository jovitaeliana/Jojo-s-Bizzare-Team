/**
 * AgentCard HTTP Endpoint
 *
 * Serves A2A protocol AgentCard JSON files for buyer and seller agents.
 * Implements the A2A discovery mechanism via well-known URIs.
 *
 * Endpoints:
 * - GET /.well-known/agent-card.json - Platform agent card (buyer by default)
 * - GET /agents/buyer/card.json - Buyer agent card
 * - GET /agents/seller/card.json - Seller agent card
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=agentCard.d.ts.map