/**
 * Agent Discovery Service
 * 
 * Integrates ERC-8004 on-chain agent registry with A2A AgentCard discovery.
 * Provides unified discovery interface for finding agents by capabilities,
 * fetching AgentCards, and verifying agent identities.
 */

import { erc8004Service } from "./erc8004.js";
import type { AgentCapability, DiscoveredAgent, MetadataEntry } from "../types/index.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * AgentCard interface (from A2A spec)
 */
export interface AgentCard {
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
  skills: AgentSkill[];
  supportsAuthenticatedExtendedCard?: boolean;
  signatures?: any[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  inputModes?: string[];
  outputModes?: string[];
  examples?: Array<{
    input: string;
    output: string;
  }>;
}

/**
 * Discovered agent with both on-chain and off-chain data
 */
export interface DiscoveredAgentWithCard extends DiscoveredAgent {
  agentCard?: AgentCard;
  cardUrl?: string;
  cardFetchError?: string;
}

/**
 * Discovery filter options
 */
export interface DiscoveryFilter {
  capability?: string;
  skill?: string;
  agentType?: "buyer" | "seller";
  minReputation?: number;
  verified?: boolean;
}

/**
 * Agent Discovery Service
 */
export class DiscoveryService {
  private erc8004 = erc8004Service; // Use singleton instance
  private localAgentCards: Map<string, AgentCard>;

  constructor() {
    this.localAgentCards = new Map();
  }

  /**
   * Register a local AgentCard for quick lookup
   */
  registerLocalAgentCard(agentId: string, card: AgentCard): void {
    this.localAgentCards.set(agentId, card);
    console.log(`📋 Registered local AgentCard for agent ${agentId}: ${card.name}`);
  }

  /**
   * Fetch AgentCard from URL
   */
  private async fetchAgentCard(url: string): Promise<AgentCard | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const card = await response.json();
      return card as AgentCard;
    } catch (error: any) {
      console.error(`Failed to fetch AgentCard from ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Get AgentCard for a specific agent
   */
  async getAgentCard(agentId: string): Promise<AgentCard | null> {
    // Check local cache first
    if (this.localAgentCards.has(agentId)) {
      return this.localAgentCards.get(agentId)!;
    }

    // Fetch from ERC-8004 metadata
    try {
      const tokenURI = await this.erc8004.getAgentMetadata(agentId, "tokenURI");
      if (tokenURI) {
        const card = await this.fetchAgentCard(tokenURI);
        if (card) {
          this.localAgentCards.set(agentId, card);
          return card;
        }
      }
    } catch (error: any) {
      console.error(`Failed to get AgentCard for agent ${agentId}:`, error.message);
    }

    return null;
  }

  /**
   * Discover agents by capability
   */
  async discoverByCapability(capability: string): Promise<DiscoveredAgentWithCard[]> {
    console.log(`🔍 Discovering agents with capability: ${capability}`);

    const agents = await this.erc8004.discoverAgents(capability);
    const agentsWithCards: DiscoveredAgentWithCard[] = [];

    for (const agent of agents) {
      const card = await this.getAgentCard(agent.agentId);
      agentsWithCards.push({
        ...agent,
        agentCard: card || undefined,
        cardUrl: card ? (agent.metadata.find((m: any) => m.key === "tokenURI")?.value as string | undefined) : undefined,
        cardFetchError: card ? undefined : "Failed to fetch AgentCard",
      });
    }

    return agentsWithCards;
  }

  /**
   * Discover agents by skill
   */
  async discoverBySkill(skillId: string): Promise<DiscoveredAgentWithCard[]> {
    console.log(`🔍 Discovering agents with skill: ${skillId}`);

    // Get all agents
    const allAgents = await this.erc8004.discoverAgents();
    const matchingAgents: DiscoveredAgentWithCard[] = [];

    for (const agent of allAgents) {
      const card = await this.getAgentCard(agent.agentId);
      
      if (card && card.skills.some(skill => skill.id === skillId)) {
        matchingAgents.push({
          ...agent,
          agentCard: card,
          cardUrl: agent.metadata.find((m: any) => m.key === "tokenURI")?.value as string | undefined,
        });
      }
    }

    return matchingAgents;
  }

  /**
   * Discover agents with advanced filtering
   */
  async discover(filter: DiscoveryFilter = {}): Promise<DiscoveredAgentWithCard[]> {
    console.log(`🔍 Discovering agents with filter:`, filter);

    let agents: DiscoveredAgent[];

    // Start with capability filter if provided
    if (filter.capability) {
      agents = await this.erc8004.discoverAgents(filter.capability);
    } else {
      agents = await this.erc8004.discoverAgents();
    }

    // Fetch AgentCards and apply additional filters
    const agentsWithCards: DiscoveredAgentWithCard[] = [];

    for (const agent of agents) {
      const card = await this.getAgentCard(agent.agentId);
      
      // Apply skill filter
      if (filter.skill && card) {
        if (!card.skills.some(skill => skill.id === filter.skill)) {
          continue;
        }
      }

      // Apply agent type filter
      if (filter.agentType && agent.metadata) {
        const agentType = agent.metadata.find(m => m.key === "agentType")?.value;
        if (agentType !== filter.agentType) {
          continue;
        }
      }

      agentsWithCards.push({
        ...agent,
        agentCard: card || undefined,
        cardUrl: card ? agent.metadata.find(m => m.key === "tokenURI")?.value : undefined,
        cardFetchError: card ? undefined : "Failed to fetch AgentCard"
      });
    }

    return agentsWithCards;
  }

  /**
   * Get our registered agents (buyer and seller)
   */
  async getOurAgents(): Promise<{
    buyer?: DiscoveredAgentWithCard;
    seller?: DiscoveredAgentWithCard;
  }> {
    const buyerAgentId = process.env.BUYER_AGENT_ID;
    const sellerAgentId = process.env.SELLER_AGENT_ID;

    const result: {
      buyer?: DiscoveredAgentWithCard;
      seller?: DiscoveredAgentWithCard;
    } = {};

    if (buyerAgentId) {
      try {
        const buyerCapabilities = await this.erc8004.queryAgentCapabilities(buyerAgentId);
        const buyerInfo = await this.erc8004.getAgentInfo(buyerAgentId);
        const buyerCard = await this.getAgentCard(buyerAgentId);

        // Convert metadata Record to MetadataEntry array
        const metadata = Object.entries(buyerInfo.metadata).map(([key, value]) => ({
          key,
          value
        }));

        result.buyer = {
          agentId: buyerAgentId,
          owner: buyerInfo.owner,
          capabilities: buyerCapabilities,
          metadata,
          agentCard: buyerCard || undefined,
          cardUrl: buyerCard ? `http://localhost:3000/agents/buyer/card.json` : undefined
        };
      } catch (error: any) {
        console.error(`Failed to get buyer agent info:`, error.message);
      }
    }

    if (sellerAgentId) {
      try {
        const sellerCapabilities = await this.erc8004.queryAgentCapabilities(sellerAgentId);
        const sellerInfo = await this.erc8004.getAgentInfo(sellerAgentId);
        const sellerCard = await this.getAgentCard(sellerAgentId);

        // Convert metadata Record to MetadataEntry array
        const metadata = Object.entries(sellerInfo.metadata).map(([key, value]) => ({
          key,
          value
        }));

        result.seller = {
          agentId: sellerAgentId,
          owner: sellerInfo.owner,
          capabilities: sellerCapabilities,
          metadata,
          agentCard: sellerCard || undefined,
          cardUrl: sellerCard ? `http://localhost:3000/agents/seller/card.json` : undefined
        };
      } catch (error: any) {
        console.error(`Failed to get seller agent info:`, error.message);
      }
    }

    return result;
  }

  /**
   * Verify agent identity
   */
  async verifyAgent(agentId: string, expectedOwner: string): Promise<boolean> {
    return this.erc8004.verifyAgentIdentity(agentId, expectedOwner);
  }
}

// Export singleton instance
export const discoveryService = new DiscoveryService();
