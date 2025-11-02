/**
 * Agent Discovery Service
 *
 * Integrates ERC-8004 on-chain agent registry with A2A AgentCard discovery.
 * Provides unified discovery interface for finding agents by capabilities,
 * fetching AgentCards, and verifying agent identities.
 */
import type { DiscoveredAgent } from "../types/index.js";
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
export declare class DiscoveryService {
    private erc8004;
    private localAgentCards;
    constructor();
    /**
     * Register a local AgentCard for quick lookup
     */
    registerLocalAgentCard(agentId: string, card: AgentCard): void;
    /**
     * Fetch AgentCard from URL
     */
    private fetchAgentCard;
    /**
     * Get AgentCard for a specific agent
     */
    getAgentCard(agentId: string): Promise<AgentCard | null>;
    /**
     * Discover agents by capability
     */
    discoverByCapability(capability: string): Promise<DiscoveredAgentWithCard[]>;
    /**
     * Discover agents by skill
     */
    discoverBySkill(skillId: string): Promise<DiscoveredAgentWithCard[]>;
    /**
     * Discover agents with advanced filtering
     */
    discover(filter?: DiscoveryFilter): Promise<DiscoveredAgentWithCard[]>;
    /**
     * Get our registered agents (buyer and seller)
     */
    getOurAgents(): Promise<{
        buyer?: DiscoveredAgentWithCard;
        seller?: DiscoveredAgentWithCard;
    }>;
    /**
     * Verify agent identity
     */
    verifyAgent(agentId: string, expectedOwner: string): Promise<boolean>;
}
export declare const discoveryService: DiscoveryService;
//# sourceMappingURL=discovery.d.ts.map