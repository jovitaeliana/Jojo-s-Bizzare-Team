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

import { Request, Response, Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/**
 * AgentCard interface (simplified from A2A spec)
 */
interface AgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  preferredTransport?: string;
  iconUrl?: string;
  provider?: {
    organization: string;
    url: string;
  };
  version: string;
  documentationUrl?: string;
  capabilities: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
    extensions?: any[];
  };
  securitySchemes?: Record<string, any>;
  security?: Record<string, string[]>[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: any[];
  supportsAuthenticatedExtendedCard?: boolean;
  signatures?: any[];
}

/**
 * Load AgentCard from file system
 */
function loadAgentCard(agentType: "buyer" | "seller"): AgentCard | null {
  try {
    const cardPath = path.join(
      __dirname,
      "../../public/agents",
      agentType,
      "card.json"
    );
    
    const cardContent = fs.readFileSync(cardPath, "utf-8");
    return JSON.parse(cardContent) as AgentCard;
  } catch (error: any) {
    console.error(`Failed to load ${agentType} agent card:`, error.message);
    return null;
  }
}

/**
 * Update AgentCard URLs based on request host
 */
function updateCardUrls(card: AgentCard, req: Request): AgentCard {
  const protocol = req.protocol;
  const host = req.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  return {
    ...card,
    url: card.url.replace("http://localhost:3000", baseUrl),
    iconUrl: card.iconUrl?.replace("http://localhost:3000", baseUrl),
    documentationUrl: card.documentationUrl?.replace("http://localhost:3000", baseUrl),
  };
}

/**
 * GET /.well-known/agent-card.json
 * 
 * Standard A2A discovery endpoint (RFC 8615)
 * Returns the buyer agent card by default
 */
router.get("/.well-known/agent-card.json", (req: Request, res: Response) => {
  console.log("📋 Serving well-known agent card");

  const card = loadAgentCard("buyer");
  
  if (!card) {
    return res.status(500).json({
      error: "Failed to load agent card",
      message: "Agent card file not found or invalid"
    });
  }

  const updatedCard = updateCardUrls(card, req);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

  res.json(updatedCard);
});

/**
 * GET /agents/buyer/card.json
 * 
 * Buyer agent card endpoint
 */
router.get("/agents/buyer/card.json", (req: Request, res: Response) => {
  console.log("📋 Serving buyer agent card");

  const card = loadAgentCard("buyer");
  
  if (!card) {
    return res.status(500).json({
      error: "Failed to load buyer agent card",
      message: "Agent card file not found or invalid"
    });
  }

  const updatedCard = updateCardUrls(card, req);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "public, max-age=3600");

  res.json(updatedCard);
});

/**
 * GET /agents/seller/card.json
 * 
 * Seller agent card endpoint
 */
router.get("/agents/seller/card.json", (req: Request, res: Response) => {
  console.log("📋 Serving seller agent card");

  const card = loadAgentCard("seller");
  
  if (!card) {
    return res.status(500).json({
      error: "Failed to load seller agent card",
      message: "Agent card file not found or invalid"
    });
  }

  const updatedCard = updateCardUrls(card, req);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "public, max-age=3600");

  res.json(updatedCard);
});

/**
 * OPTIONS handler for CORS preflight
 */
router.options("/.well-known/agent-card.json", (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(204).send();
});

router.options("/agents/:agentType/card.json", (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(204).send();
});

/**
 * GET /agents/list
 * 
 * List all available agents
 */
router.get("/agents/list", (req: Request, res: Response) => {
  console.log("📋 Listing all agents");

  const buyerCard = loadAgentCard("buyer");
  const sellerCard = loadAgentCard("seller");

  const agents = [];

  if (buyerCard) {
    agents.push({
      type: "buyer",
      name: buyerCard.name,
      description: buyerCard.description,
      cardUrl: `${req.protocol}://${req.get("host")}/agents/buyer/card.json`,
      skills: buyerCard.skills.map(s => s.id)
    });
  }

  if (sellerCard) {
    agents.push({
      type: "seller",
      name: sellerCard.name,
      description: sellerCard.description,
      cardUrl: `${req.protocol}://${req.get("host")}/agents/seller/card.json`,
      skills: sellerCard.skills.map(s => s.id)
    });
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json({
    agents,
    total: agents.length
  });
});

export default router;

