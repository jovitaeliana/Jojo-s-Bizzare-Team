# 🏗️ Hedera Agentic Marketplace - Architecture Diagrams

This document contains Mermaid diagrams for the presentation.

---

## 📊 System Architecture

```mermaid
graph TB
    subgraph "User Layer"
        User[👤 User Request<br/>'I want potato chips']
    end

    subgraph "Agent Layer"
        BuyerAgent[🤖 Buyer Agent<br/>LangGraph Workflow]
        SellerAgent[🛍️ Seller Agent<br/>Product Listings]
    end

    subgraph "Protocol Layer"
        ERC8004[🔍 ERC-8004<br/>Agent Discovery]
        A2A[💬 A2A Protocol<br/>Agent Communication]
        x402[💳 x402 Protocol<br/>Blockchain Payment]
        HCS[📋 HCS<br/>Audit Logging]
    end

    subgraph "Blockchain Layer"
        Hedera[⛓️ Hedera Testnet<br/>Chain ID: 296]
        Registry[📝 Identity Registry<br/>0x4c74...5923]
        Topic[📨 HCS Topic<br/>0.0.7180007]
    end

    subgraph "Observability"
        LangSmith[📊 LangSmith<br/>Workflow Tracing]
        HashScan[🔎 HashScan<br/>Blockchain Explorer]
    end

    User -->|Request| BuyerAgent
    BuyerAgent -->|Discover| ERC8004
    BuyerAgent -->|Communicate| A2A
    BuyerAgent -->|Pay| x402
    BuyerAgent -->|Log| HCS

    ERC8004 -->|Query| Registry
    A2A -->|JSON-RPC| SellerAgent
    x402 -->|Transfer| Hedera
    HCS -->|Submit| Topic

    Registry -->|On-chain| Hedera
    Topic -->|On-chain| Hedera

    BuyerAgent -.->|Trace| LangSmith
    Hedera -.->|Verify| HashScan

    style BuyerAgent fill:#4CAF50
    style SellerAgent fill:#2196F3
    style Hedera fill:#FF9800
    style LangSmith fill:#9C27B0
```

---

## 🔄 Workflow Sequence

```mermaid
sequenceDiagram
    participant User
    participant Buyer as 🤖 Buyer Agent
    participant ERC8004 as 🔍 ERC-8004
    participant Seller as 🛍️ Seller Agent
    participant x402 as 💳 x402
    participant HCS as 📋 HCS
    participant Hedera as ⛓️ Hedera

    User->>Buyer: "I want potato chips"

    Note over Buyer: DISCOVER Phase
    Buyer->>ERC8004: discoverByCapability("sell")
    ERC8004->>Hedera: Query registry contract
    Hedera-->>ERC8004: Seller agents found
    ERC8004-->>Buyer: [Seller Agent 115]
    Buyer->>HCS: Log AGENTS_DISCOVERED
    HCS->>Hedera: Submit message to topic

    Note over Buyer: SELECT Phase
    Buyer->>Seller: A2A: getListings()
    Seller-->>Buyer: [Potato Chips - 2 HBAR]
    Buyer->>Buyer: LLM evaluates products
    Buyer->>HCS: Log PRODUCT_SELECTED
    HCS->>Hedera: Submit message to topic

    Note over Buyer: NEGOTIATE Phase
    Buyer->>Seller: A2A: negotiate(offer: 2 HBAR)
    Seller-->>Buyer: Accepted
    Buyer->>HCS: Log OFFER_ACCEPTED
    HCS->>Hedera: Submit message to topic

    Note over Buyer: PAY Phase
    Buyer->>x402: processPayment(2 HBAR)
    x402->>Hedera: TransferTransaction
    Hedera-->>x402: Transaction ID
    x402-->>Buyer: Payment successful
    Buyer->>HCS: Log PAYMENT_COMPLETED
    HCS->>Hedera: Submit message to topic

    Note over Buyer: COMPLETE Phase
    Buyer->>HCS: Log TRANSACTION_COMPLETED
    HCS->>Hedera: Submit message to topic
    Buyer-->>User: ✅ Purchase complete!
```

---

## 🧩 Protocol Integration

```mermaid
graph LR
    subgraph "ERC-8004: Agent Identity"
        A1[Agent Registration]
        A2[Capability Registry]
        A3[Discovery Service]
        A1 --> A2 --> A3
    end

    subgraph "A2A: Communication"
        B1[JSON-RPC Server]
        B2[Message Protocol]
        B3[Task Management]
        B1 --> B2 --> B3
    end

    subgraph "x402: Payment"
        C1[Payment Request]
        C2[Hedera Transfer]
        C3[Verification]
        C1 --> C2 --> C3
    end

    subgraph "HCS: Audit Trail"
        D1[Event Logging]
        D2[Topic Messages]
        D3[Immutable Record]
        D1 --> D2 --> D3
    end

    A3 -->|Agents Found| B1
    B3 -->|Agreement| C1
    C3 -->|Success| D1

    style A1 fill:#E3F2FD
    style B1 fill:#F3E5F5
    style C1 fill:#FFF3E0
    style D1 fill:#E8F5E9
```

---

## 🤖 LangGraph Workflow

```mermaid
stateDiagram-v2
    [*] --> DISCOVER

    DISCOVER --> SELECT: Agents found
    DISCOVER --> END: No agents

    SELECT --> NEGOTIATE: Product selected
    SELECT --> END: No suitable product

    NEGOTIATE --> PAY: Offer accepted
    NEGOTIATE --> END: Negotiation failed

    PAY --> COMPLETE: Payment successful
    PAY --> END: Payment failed

    COMPLETE --> [*]: Transaction complete
    END --> [*]: Workflow ended

    note right of DISCOVER
        🔍 ERC-8004 Discovery
        📋 HCS: AGENTS_DISCOVERED
    end note

    note right of SELECT
        🤔 LLM Evaluation
        📋 HCS: PRODUCT_SELECTED
    end note

    note right of NEGOTIATE
        💬 A2A Communication
        📋 HCS: OFFER_ACCEPTED
    end note

    note right of PAY
        💳 x402 Payment
        📋 HCS: PAYMENT_COMPLETED
    end note

    note right of COMPLETE
        ✅ Finalize
        📋 HCS: TRANSACTION_COMPLETED
    end note
```

---

## 🔐 Security & Trust Model

```mermaid
graph TB
    subgraph "Trust Establishment"
        T1[On-Chain Identity<br/>ERC-8004 NFT]
        T2[Capability Verification<br/>Registry Query]
        T3[Immutable Audit<br/>HCS Logging]
    end

    subgraph "Payment Security"
        P1[Blockchain Payment<br/>x402 Protocol]
        P2[Transaction Verification<br/>HashScan]
        P3[Atomic Settlement<br/>Hedera Consensus]
    end

    subgraph "Communication Security"
        C1[Authenticated Endpoints<br/>A2A Protocol]
        C2[Message Validation<br/>JSON-RPC]
        C3[State Tracking<br/>Task Management]
    end

    T1 --> T2 --> T3
    P1 --> P2 --> P3
    C1 --> C2 --> C3

    T3 -.->|Verifies| P1
    P3 -.->|Confirms| C3
    C3 -.->|Logs to| T3

    style T1 fill:#4CAF50
    style P1 fill:#2196F3
    style C1 fill:#FF9800
```

---

## 📊 Data Flow

```mermaid
flowchart LR
    subgraph Input
        I1[User Request]
        I2[Budget]
    end

    subgraph Discovery
        D1[Query ERC-8004]
        D2[Find Sellers]
        D3[Fetch Listings]
    end

    subgraph Decision
        E1[LLM Evaluation]
        E2[Product Selection]
        E3[Price Negotiation]
    end

    subgraph Execution
        X1[x402 Payment]
        X2[Blockchain TX]
        X3[Confirmation]
    end

    subgraph Logging
        L1[HCS Events]
        L2[Audit Trail]
        L3[HashScan Proof]
    end

    I1 --> D1
    I2 --> D1
    D1 --> D2 --> D3
    D3 --> E1 --> E2 --> E3
    E3 --> X1 --> X2 --> X3

    D2 -.->|Log| L1
    E2 -.->|Log| L1
    E3 -.->|Log| L1
    X3 -.->|Log| L1
    L1 --> L2 --> L3

    style I1 fill:#E3F2FD
    style E1 fill:#F3E5F5
    style X1 fill:#FFF3E0
    style L1 fill:#E8F5E9
```

---

## 🎯 Value Proposition

```mermaid
mindmap
  root((Hedera Agentic<br/>Marketplace))
    Trust
      On-chain Identity
      Immutable Audit
      Public Verification
    Autonomy
      AI Decision Making
      No Human Intervention
      LangGraph Workflows
    Security
      Blockchain Payments
      Atomic Settlement
      Verified Transactions
    Transparency
      HCS Logging
      HashScan Explorer
      LangSmith Tracing
    Scalability
      Standard Protocols
      Modular Architecture
      Multi-Agent Support
```

---

## 📈 Technical Stack

```mermaid
graph TB
    subgraph "Frontend (Future)"
        F1[React + TypeScript]
        F2[Hedera SDK]
        F3[Web3 Integration]
    end

    subgraph "Backend"
        B1[Node.js + TypeScript]
        B2[LangGraph Agents]
        B3[Express Server]
    end

    subgraph "AI/ML"
        A1[Groq LLM]
        A2[LangChain Tools]
        A3[LangSmith Tracing]
    end

    subgraph "Blockchain"
        C1[Hedera SDK]
        C2[Ethers.js]
        C3[Smart Contracts]
    end

    subgraph "Protocols"
        P1[ERC-8004]
        P2[A2A]
        P3[x402]
        P4[HCS]
    end

    F1 --> B1
    B1 --> B2
    B2 --> A1
    B2 --> C1

    A1 --> A2 --> A3
    C1 --> C2 --> C3

    B2 --> P1
    B2 --> P2
    B2 --> P3
    B2 --> P4

    style B2 fill:#4CAF50
    style A1 fill:#2196F3
    style C1 fill:#FF9800
```

---

## 🚀 Future Roadmap

```mermaid
timeline
    title Hedera Agentic Marketplace Roadmap

    section Phase 1 (Current)
        Agent Identity : ERC-8004 Registration
        Communication : A2A Protocol
        Payments : x402 Integration
        Audit : HCS Logging

    section Phase 2 (Next 3 months)
        Multi-Agent : Multiple Sellers
        Reputation : Trust Scoring
        Advanced Negotiation : ML-based Strategies
        Frontend : React UI

    section Phase 3 (6 months)
        Escrow : Smart Contract Integration
        Cross-Chain : Multi-blockchain Support
        Agent Marketplace : Agent-as-a-Service
        Enterprise : B2B Integration

    section Phase 4 (12 months)
        Decentralized : Fully On-Chain
        AI Governance : DAO for Agents
        Global Scale : Production Deployment
        Ecosystem : Developer Platform
```

---

## 📝 Notes for Presentation

### Diagram Usage

1. **System Architecture**: Use for high-level overview (Slide 3)
2. **Workflow Sequence**: Use for detailed walkthrough (Slide 5)
3. **Protocol Integration**: Use for technical depth (Slide 6)
4. **LangGraph Workflow**: Use during demo narration (Slide 7)
5. **Security Model**: Use for trust/security discussion (Slide 8)
6. **Value Proposition**: Use for conclusion (Slide 10)

### Rendering

These diagrams can be:
- Rendered in Markdown viewers (GitHub, VS Code)
- Exported to PNG using Mermaid CLI
- Embedded in presentation slides
- Shown live in browser

### Color Coding

- 🟢 Green: Buyer Agent / Success
- 🔵 Blue: Seller Agent / Communication
- 🟠 Orange: Blockchain / Hedera
- 🟣 Purple: AI/ML / LangSmith

