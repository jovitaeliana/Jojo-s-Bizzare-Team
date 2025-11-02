export interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  source: 'agent' | 'ebay' | 'amazon' | 'etsy' | 'other';
  seller: string;
  sellerType: 'ai-agent' | 'traditional';
  rating?: number;
  reviews?: number;
  isVerified?: boolean;
  agentAddress?: string; // Hedera account ID for AI agents
  description?: string;
  url?: string;
}

export interface Transaction {
  id: string;
  product: Product;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  transactionHash?: string;
  paymentMethod: 'hedera' | 'traditional';
}

export interface AgentCapability {
  name: string;
  description: string;
  endpoint: string;
}

export interface MetadataEntry {
  key: string;
  value: string;
}

export interface DiscoveredAgent {
  agentId: string;
  owner: string;
  capabilities: AgentCapability[];
  metadata: MetadataEntry[];
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  category?: string;
  status: 'draft' | 'active' | 'sold' | 'cancelled';
  sellerAddress?: string; // Hedera account ID
  createdAt: Date;
  updatedAt: Date;
}
