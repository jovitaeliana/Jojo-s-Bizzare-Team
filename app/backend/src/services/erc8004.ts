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
import dotenv from "dotenv";
import { DiscoveredAgent, AgentCapability } from '../types';

dotenv.config();

// ERC-8004 IdentityRegistry Contract Address on Hedera Testnet
const IDENTITY_REGISTRY_ADDRESS = "0x4c74ebd72921d537159ed2053f46c12a7d8e5923";

// ERC-8004 IdentityRegistry ABI (minimal interface)
const IDENTITY_REGISTRY_ABI = [
  // Registration functions
  "function register() external returns (uint256 agentId)",
  "function register(string memory tokenUri) external returns (uint256 agentId)",
  "function register(string memory tokenUri, tuple(string key, bytes value)[] memory metadata) external returns (uint256 agentId)",

  // Metadata functions
  "function getMetadata(uint256 agentId, string memory key) external view returns (bytes memory)",
  "function setMetadata(uint256 agentId, string memory key, bytes memory value) external",
  "function setAgentUri(uint256 agentId, string calldata newUri) external",

  // ERC-721 functions
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function balanceOf(address owner) external view returns (uint256)",

  // Events
  "event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)",
  "event MetadataSet(uint256 indexed agentId, string indexed indexedKey, string key, bytes value)",
  "event UriUpdated(uint256 indexed agentId, string newUri, address indexed updatedBy)"
];

/**
 * Metadata entry for agent registration
 */
export interface MetadataEntry {
  key: string;
  value: string; // Will be encoded to bytes
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
export class ERC8004Service {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private wallet?: ethers.Wallet;
  private discoveredAgents: Map<string, DiscoveredAgent> = new Map();

  constructor() {
    const rpcUrl = process.env.JSON_RPC_URL || "https://testnet.hashio.io/api";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create read-only contract instance
    this.contract = new ethers.Contract(
      IDENTITY_REGISTRY_ADDRESS,
      IDENTITY_REGISTRY_ABI,
      this.provider
    );
  }

  /**
   * Connect with a wallet for write operations
   */
  connectWallet(privateKey: string): void {
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      IDENTITY_REGISTRY_ADDRESS,
      IDENTITY_REGISTRY_ABI,
      this.wallet
    );
  }

  /**
   * Register a new agent on-chain
   *
   * @param tokenURI - URI pointing to agent metadata (IPFS, HTTPS, etc.)
   * @param metadata - Optional on-chain metadata entries
   * @returns Agent ID (ERC-721 token ID)
   */
  async registerAgent(
    name: string,
    address: string,
    capabilities: AgentCapability[],
    tokenURI?: string,
    metadata?: MetadataEntry[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error("Wallet not connected. Call connectWallet() first.");
    }

    const uri = tokenURI || `https://marketplace.hedera.com/agents/${name.toLowerCase().replace(/\s+/g, '-')}`;

    console.log(`📝 Registering agent "${name}" with URI: ${uri}`);

    try {
      // Prepare metadata with capabilities
      const capabilitiesStr = capabilities.map(c => c.name).join(',');
      const metadataEntries: MetadataEntry[] = [
        { key: "agentName", value: name },
        { key: "agentWallet", value: address },
        { key: "capabilities", value: capabilitiesStr },
        ...(metadata || [])
      ];

      // Encode metadata values to bytes
      const encodedMetadata = metadataEntries.map(entry => ({
        key: entry.key,
        value: ethers.toUtf8Bytes(entry.value)
      }));

      // Use getFunction to explicitly call the correct overload
      const tx = await this.contract.getFunction("register(string,(string,bytes)[])")(uri, encodedMetadata);

      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Extract agentId from Registered event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === "Registered";
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        const agentId = parsed?.args.agentId.toString();
        console.log(`🎉 Agent registered with ID: ${agentId}`);

        // Cache the agent
        const discoveredAgent: DiscoveredAgent = {
          agentId,
          owner: address,
          capabilities,
          metadata: (metadata || []).map(m => ({ key: m.key, value: m.value }))
        };
        this.discoveredAgents.set(agentId, discoveredAgent);

        return agentId;
      }

      throw new Error("Failed to extract agentId from transaction receipt");
    } catch (error: any) {
      console.error("❌ Registration failed:", error.message);
      throw error;
    }
  }

  /**
   * Get agent metadata by key
   */
  async getAgentMetadata(agentId: string, key: string): Promise<string> {
    try {
      const value = await this.contract.getMetadata(agentId, key);
      return ethers.toUtf8String(value);
    } catch (error: any) {
      console.error(`❌ Failed to get metadata for agent ${agentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get agent token URI
   */
  async getAgentTokenURI(agentId: string): Promise<string> {
    try {
      return await this.contract.tokenURI(agentId);
    } catch (error: any) {
      console.error(`❌ Failed to get token URI for agent ${agentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get agent owner address
   */
  async getAgentOwner(agentId: string): Promise<string> {
    try {
      return await this.contract.ownerOf(agentId);
    } catch (error: any) {
      console.error(`❌ Failed to get owner for agent ${agentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get full agent information
   */
  async getAgentInfo(agentId: string, metadataKeys?: string[]): Promise<AgentInfo> {
    try {
      const [owner, tokenURI] = await Promise.all([
        this.getAgentOwner(agentId),
        this.getAgentTokenURI(agentId)
      ]);

      const metadata: Record<string, string> = {};

      const keys = metadataKeys || ["agentName", "agentWallet", "capabilities"];
      for (const key of keys) {
        try {
          metadata[key] = await this.getAgentMetadata(agentId, key);
        } catch {
          // Key doesn't exist, skip
        }
      }

      return {
        agentId,
        owner,
        tokenURI,
        metadata
      };
    } catch (error: any) {
      console.error(`❌ Failed to get agent info for ${agentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Discover agents by querying the registry
   * Returns cached agents for MVP
   */
  async discoverAgents(capability?: string): Promise<DiscoveredAgent[]> {
    console.log(`🔍 Discovering agents${capability ? ` with capability: ${capability}` : ""}...`);

    // Populate cache with known agents from environment if not already cached
    const buyerAgentId = process.env.BUYER_AGENT_ID;
    const sellerAgentId = process.env.SELLER_AGENT_ID;

    const agentIds = [buyerAgentId, sellerAgentId].filter((id): id is string => !!id);

    for (const agentId of agentIds) {
      if (!this.discoveredAgents.has(agentId)) {
        try {
          const info = await this.getAgentInfo(agentId);
          const capabilities = await this.queryAgentCapabilities(agentId);

          const discoveredAgent: DiscoveredAgent = {
            agentId,
            owner: info.owner,
            capabilities,
            metadata: Object.entries(info.metadata).map(([key, value]) => ({ key, value }))
          };

          this.discoveredAgents.set(agentId, discoveredAgent);
        } catch (error: any) {
          console.error(`Failed to discover agent ${agentId}:`, error.message);
        }
      }
    }

    const agents = Array.from(this.discoveredAgents.values());

    if (capability) {
      return agents.filter(agent =>
        agent.capabilities.some(cap => cap.name.includes(capability))
      );
    }

    return agents;
  }

  /**
   * Query specific agent capabilities
   */
  async queryAgentCapabilities(agentId: string): Promise<AgentCapability[]> {
    try {
      const agent = this.discoveredAgents.get(agentId);
      if (agent) {
        return agent.capabilities;
      }

      // Try to fetch from on-chain metadata
      const capabilitiesStr = await this.getAgentMetadata(agentId, "capabilities");
      if (capabilitiesStr) {
        return capabilitiesStr.split(',').map(name => ({
          name,
          description: `Capability: ${name}`,
          endpoint: `/api/${name}`
        }));
      }

      return [];
    } catch (error) {
      console.error('Capability query failed:', error);
      return [];
    }
  }

  /**
   * Verify agent trust score
   */
  async verifyAgentTrust(agentAddress: string): Promise<number> {
    try {
      const agent = Array.from(this.discoveredAgents.values()).find(
        (a) => a.owner.toLowerCase() === agentAddress.toLowerCase()
      );

      // For now, return a default trust score
      return agent ? 100 : 0;
    } catch (error) {
      console.error('Trust verification failed:', error);
      return 0;
    }
  }

  /**
   * Verify agent identity
   */
  async verifyAgentIdentity(agentId: string, expectedOwner: string): Promise<boolean> {
    try {
      const actualOwner = await this.getAgentOwner(agentId);
      return actualOwner.toLowerCase() === expectedOwner.toLowerCase();
    } catch (error: any) {
      console.error(`❌ Failed to verify agent ${agentId}:`, error.message);
      return false;
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): DiscoveredAgent | undefined {
    return this.discoveredAgents.get(agentId);
  }

  /**
   * Get all discovered agents
   */
  getAllAgents(): DiscoveredAgent[] {
    return Array.from(this.discoveredAgents.values());
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return IDENTITY_REGISTRY_ADDRESS;
  }

  /**
   * Get provider
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}

// Singleton instance
export const erc8004Service = new ERC8004Service();
