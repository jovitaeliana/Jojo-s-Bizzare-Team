/**
 * ERC-8004 Identity Registry Service
 *
 * Provides agent discovery and trust establishment through the ERC-8004 protocol.
 * Connects to the deployed IdentityRegistry contract on Hedera testnet.
 *
 * Contract Address: 0x4c74ebd72921d537159ed2053f46c12a7d8e5923
 * Network: Hedera Testnet (Chain ID: 296)
 */
import { ethers } from "ethers";
import { DiscoveredAgent, AgentCapability } from '../types';
/**
 * Metadata entry for agent registration
 */
export interface MetadataEntry {
    key: string;
    value: string;
}
/**
 * Agent information from ERC-8004 registry
 */
export interface AgentInfo {
    agentId: string;
    owner: string;
    tokenURI: string;
    metadata: Record<string, string>;
}
/**
 * ERC-8004 Service for agent discovery and registration
 */
export declare class ERC8004Service {
    private provider;
    private contract;
    private wallet?;
    private discoveredAgents;
    constructor();
    /**
     * Connect with a wallet for write operations
     */
    connectWallet(privateKey: string): void;
    /**
     * Register a new agent on-chain
     *
     * @param tokenURI - URI pointing to agent metadata (IPFS, HTTPS, etc.)
     * @param metadata - Optional on-chain metadata entries
     * @returns Agent ID (ERC-721 token ID)
     */
    registerAgent(name: string, address: string, capabilities: AgentCapability[], tokenURI?: string, metadata?: MetadataEntry[]): Promise<string>;
    /**
     * Get agent metadata by key
     */
    getAgentMetadata(agentId: string, key: string): Promise<string>;
    /**
     * Get agent token URI
     */
    getAgentTokenURI(agentId: string): Promise<string>;
    /**
     * Get agent owner address
     */
    getAgentOwner(agentId: string): Promise<string>;
    /**
     * Get full agent information
     */
    getAgentInfo(agentId: string, metadataKeys?: string[]): Promise<AgentInfo>;
    /**
     * Discover agents by querying the registry
     * Returns cached agents for MVP
     */
    discoverAgents(capability?: string): Promise<DiscoveredAgent[]>;
    /**
     * Query specific agent capabilities
     */
    queryAgentCapabilities(agentId: string): Promise<AgentCapability[]>;
    /**
     * Verify agent trust score
     */
    verifyAgentTrust(agentAddress: string): Promise<number>;
    /**
     * Verify agent identity
     */
    verifyAgentIdentity(agentId: string, expectedOwner: string): Promise<boolean>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): DiscoveredAgent | undefined;
    /**
     * Get all discovered agents
     */
    getAllAgents(): DiscoveredAgent[];
    /**
     * Get contract address
     */
    getContractAddress(): string;
    /**
     * Get provider
     */
    getProvider(): ethers.JsonRpcProvider;
}
export declare const erc8004Service: ERC8004Service;
//# sourceMappingURL=erc8004.d.ts.map