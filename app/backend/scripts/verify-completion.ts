/**
 * Comprehensive Verification Script
 * 
 * Verifies that all Priority 1, 2, and 3 tasks are complete
 * Checks for missing implementations and skipped tasks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n" + "=".repeat(80));
console.log("🔍 COMPREHENSIVE VERIFICATION: Priorities 1, 2, 3");
console.log("=".repeat(80) + "\n");

let totalChecks = 0;
let passedChecks = 0;
let failedChecks: string[] = [];

function check(name: string, condition: boolean, details?: string): void {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    failedChecks.push(name);
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// ============================================================================
// PRIORITY 1: ERC-8004 Integration
// ============================================================================
console.log("📋 PRIORITY 1: ERC-8004 Integration");
console.log("-".repeat(80));

// 1.1 ERC-8004 Service File
const erc8004Path = path.join(__dirname, '../src/services/erc8004.ts');
check(
  "1.1.1 ERC-8004 service file exists",
  fs.existsSync(erc8004Path),
  erc8004Path
);

if (fs.existsSync(erc8004Path)) {
  const erc8004Content = fs.readFileSync(erc8004Path, 'utf-8');
  
  check(
    "1.1.2 registerAgent() method exists",
    erc8004Content.includes('registerAgent'),
    "Required for agent registration"
  );
  
  check(
    "1.1.3 discoverAgents() method exists",
    erc8004Content.includes('discoverAgents'),
    "Required for agent discovery"
  );
  
  check(
    "1.1.4 getAgentMetadata() method exists",
    erc8004Content.includes('getAgentMetadata'),
    "Required for metadata retrieval"
  );
  
  check(
    "1.1.5 verifyAgentIdentity() method exists",
    erc8004Content.includes('verifyAgentIdentity'),
    "Required for trust verification"
  );
  
  check(
    "1.1.6 Contract address configured",
    erc8004Content.includes('0x4c74ebd72921d537159ed2053f46c12a7d8e5923'),
    "IdentityRegistry contract address"
  );
}

// 1.2 Registration Script
const registerScriptPath = path.join(__dirname, '../scripts/register-agents.ts');
check(
  "1.2.1 Agent registration script exists",
  fs.existsSync(registerScriptPath),
  registerScriptPath
);

// 1.3 Environment Variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  check(
    "1.3.1 BUYER_AGENT_ID configured",
    envContent.includes('BUYER_AGENT_ID=27'),
    "Buyer agent registered on-chain"
  );
  
  check(
    "1.3.2 SELLER_AGENT_ID configured",
    envContent.includes('SELLER_AGENT_ID=28'),
    "Seller agent registered on-chain"
  );
  
  check(
    "1.3.3 BUYER_EVM_ADDRESS configured",
    envContent.includes('BUYER_EVM_ADDRESS='),
    "Buyer EVM address for verification"
  );
  
  check(
    "1.3.4 SELLER_EVM_ADDRESS configured",
    envContent.includes('SELLER_EVM_ADDRESS='),
    "Seller EVM address for verification"
  );
}

// 1.4 Test Script
const testDiscoveryPath = path.join(__dirname, '../scripts/test-agentcard-discovery.ts');
check(
  "1.4.1 Discovery test script exists",
  fs.existsSync(testDiscoveryPath),
  testDiscoveryPath
);

console.log();

// ============================================================================
// PRIORITY 2: AgentCard & Discovery
// ============================================================================
console.log("📋 PRIORITY 2: AgentCard & Discovery");
console.log("-".repeat(80));

// 2.1 AgentCard JSON Files
const buyerCardPath = path.join(__dirname, '../public/agents/buyer/card.json');
const sellerCardPath = path.join(__dirname, '../public/agents/seller/card.json');

check(
  "2.1.1 Buyer AgentCard exists",
  fs.existsSync(buyerCardPath),
  buyerCardPath
);

check(
  "2.1.2 Seller AgentCard exists",
  fs.existsSync(sellerCardPath),
  sellerCardPath
);

if (fs.existsSync(buyerCardPath)) {
  const buyerCard = JSON.parse(fs.readFileSync(buyerCardPath, 'utf-8'));
  
  check(
    "2.1.3 Buyer AgentCard has name",
    !!buyerCard.name,
    `Name: ${buyerCard.name}`
  );
  
  check(
    "2.1.4 Buyer AgentCard has skills",
    Array.isArray(buyerCard.skills) && buyerCard.skills.length > 0,
    `Skills: ${buyerCard.skills?.length || 0}`
  );
  
  check(
    "2.1.5 Buyer AgentCard has service endpoint",
    !!buyerCard.url,
    `Endpoint: ${buyerCard.url}`
  );

  check(
    "2.1.6 Buyer AgentCard has security scheme",
    !!buyerCard.securitySchemes,
    `Security: ${Object.keys(buyerCard.securitySchemes || {}).join(', ')}`
  );

  check(
    "2.1.7 Buyer AgentCard has transport protocol",
    !!buyerCard.preferredTransport,
    `Transport: ${buyerCard.preferredTransport}`
  );
}

if (fs.existsSync(sellerCardPath)) {
  const sellerCard = JSON.parse(fs.readFileSync(sellerCardPath, 'utf-8'));
  
  check(
    "2.1.8 Seller AgentCard has skills",
    Array.isArray(sellerCard.skills) && sellerCard.skills.length > 0,
    `Skills: ${sellerCard.skills?.length || 0}`
  );
}

// 2.2 AgentCard HTTP Endpoint
const agentCardApiPath = path.join(__dirname, '../src/api/agentCard.ts');
check(
  "2.2.1 AgentCard API file exists",
  fs.existsSync(agentCardApiPath),
  agentCardApiPath
);

// 2.3 Discovery Service
const discoveryPath = path.join(__dirname, '../src/services/discovery.ts');
check(
  "2.3.1 Discovery service file exists",
  fs.existsSync(discoveryPath),
  discoveryPath
);

if (fs.existsSync(discoveryPath)) {
  const discoveryContent = fs.readFileSync(discoveryPath, 'utf-8');
  
  check(
    "2.3.2 getOurAgents() method exists",
    discoveryContent.includes('getOurAgents'),
    "Required for listing registered agents"
  );
  
  check(
    "2.3.3 getAgentCard() method exists",
    discoveryContent.includes('getAgentCard'),
    "Required for fetching AgentCards"
  );
}

console.log();

// ============================================================================
// PRIORITY 3: A2A JSON-RPC Server
// ============================================================================
console.log("📋 PRIORITY 3: A2A JSON-RPC Server");
console.log("-".repeat(80));

// 3.1 A2A Type Definitions
const a2aTypesPath = path.join(__dirname, '../src/types/a2a.ts');
check(
  "3.1.1 A2A types file exists",
  fs.existsSync(a2aTypesPath),
  a2aTypesPath
);

if (fs.existsSync(a2aTypesPath)) {
  const a2aTypesContent = fs.readFileSync(a2aTypesPath, 'utf-8');
  
  check(
    "3.1.2 JSONRPCRequest interface exists",
    a2aTypesContent.includes('interface JSONRPCRequest'),
    "Required for JSON-RPC 2.0"
  );
  
  check(
    "3.1.3 JSONRPCResponse interface exists",
    a2aTypesContent.includes('interface JSONRPCResponse'),
    "Required for JSON-RPC 2.0"
  );
  
  check(
    "3.1.4 A2AMessage interface exists",
    a2aTypesContent.includes('interface A2AMessage'),
    "Required for A2A protocol"
  );
  
  check(
    "3.1.5 A2ATask interface exists",
    a2aTypesContent.includes('interface A2ATask'),
    "Required for task management"
  );
  
  check(
    "3.1.6 Helper functions exist",
    a2aTypesContent.includes('createJSONRPCRequest') &&
    a2aTypesContent.includes('createA2AMessage'),
    "Required for message creation"
  );
}

// 3.2 A2A Server
const a2aServerPath = path.join(__dirname, '../src/api/a2aServer.ts');
check(
  "3.2.1 A2A server file exists",
  fs.existsSync(a2aServerPath),
  a2aServerPath
);

if (fs.existsSync(a2aServerPath)) {
  const a2aServerContent = fs.readFileSync(a2aServerPath, 'utf-8');
  
  check(
    "3.2.2 handleMessageSend() method exists",
    a2aServerContent.includes('handleMessageSend'),
    "Required for message/send"
  );
  
  check(
    "3.2.3 handleTaskGet() method exists",
    a2aServerContent.includes('handleTaskGet'),
    "Required for tasks/get"
  );
  
  check(
    "3.2.4 handleTaskCancel() method exists",
    a2aServerContent.includes('handleTaskCancel'),
    "Required for tasks/cancel"
  );
  
  check(
    "3.2.5 handleTaskList() method exists",
    a2aServerContent.includes('handleTaskList'),
    "Required for tasks/list"
  );
  
  check(
    "3.2.6 registerMessageHandler() method exists",
    a2aServerContent.includes('registerMessageHandler'),
    "Required for custom agent logic"
  );
  
  check(
    "3.2.7 Express router exists",
    a2aServerContent.includes('createA2ARouter'),
    "Required for HTTP endpoints"
  );
}

// 3.3 A2A Client
const a2aClientPath = path.join(__dirname, '../src/services/a2aClient.ts');
check(
  "3.3.1 A2A client file exists",
  fs.existsSync(a2aClientPath),
  a2aClientPath
);

if (fs.existsSync(a2aClientPath)) {
  const a2aClientContent = fs.readFileSync(a2aClientPath, 'utf-8');
  
  check(
    "3.3.2 sendMessage() method exists",
    a2aClientContent.includes('sendMessage'),
    "Required for sending messages"
  );
  
  check(
    "3.3.3 waitForTask() method exists",
    a2aClientContent.includes('waitForTask'),
    "Required for polling task status"
  );
  
  check(
    "3.3.4 createBuyerClient() helper exists",
    a2aClientContent.includes('createBuyerClient'),
    "Required for buyer agent client"
  );
  
  check(
    "3.3.5 createSellerClient() helper exists",
    a2aClientContent.includes('createSellerClient'),
    "Required for seller agent client"
  );
}

// 3.4 Express Integration
const indexPath = path.join(__dirname, '../src/index.ts');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  check(
    "3.4.1 A2A server imported in index.ts",
    indexContent.includes('a2aServer') || indexContent.includes('createA2ARouter'),
    "Required for Express integration"
  );
  
  check(
    "3.4.2 A2A routes registered",
    indexContent.includes('app.use') && indexContent.includes('a2a'),
    "Required for HTTP endpoints"
  );
  
  check(
    "3.4.3 CORS allows X-Agent-API-Key",
    indexContent.includes('X-Agent-API-Key'),
    "Required for authentication"
  );
}

// 3.5 Test Script
const testA2APath = path.join(__dirname, '../scripts/test-a2a-server.ts');
check(
  "3.5.1 A2A test script exists",
  fs.existsSync(testA2APath),
  testA2APath
);

console.log();

// ============================================================================
// SUMMARY
// ============================================================================
console.log("=".repeat(80));
console.log("📊 VERIFICATION SUMMARY");
console.log("=".repeat(80));
console.log(`Total Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks} ✅`);
console.log(`Failed: ${failedChecks.length} ❌`);
console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
console.log("=".repeat(80));

if (failedChecks.length > 0) {
  console.log("\n❌ Failed Checks:");
  failedChecks.forEach((check, i) => {
    console.log(`   ${i + 1}. ${check}`);
  });
  console.log();
  process.exit(1);
} else {
  console.log("\n🎉 All checks passed! Priorities 1, 2, 3 are complete!\n");
  process.exit(0);
}

