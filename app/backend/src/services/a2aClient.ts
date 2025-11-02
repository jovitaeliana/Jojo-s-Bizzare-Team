/**
 * A2A (Agent-to-Agent) Client
 * 
 * Client for communicating with other agents via A2A JSON-RPC protocol
 */

import {
  JSONRPCRequest,
  JSONRPCResponse,
  A2AMessage,
  A2ATask,
  A2AClientConfig,
  MessageSendParams,
  TaskGetParams,
  TaskCancelParams,
  TaskListParams,
  TaskListResponse,
  createJSONRPCRequest,
  createA2AMessage,
} from "../types/a2a.js";

/**
 * A2A Client Class
 * Provides methods to communicate with other agents
 */
export class A2AClient {
  private config: A2AClientConfig;

  constructor(config: A2AClientConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      ...config,
    };
  }

  /**
   * Send a JSON-RPC request to an agent
   */
  private async sendRequest(
    targetAgentId: string,
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse> {
    const url = `${this.config.baseUrl}/api/a2a/${targetAgentId}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication
    if (this.config.auth.type === "bearer" && this.config.auth.token) {
      headers["Authorization"] = `Bearer ${this.config.auth.token}`;
    } else if (this.config.auth.type === "api-key" && this.config.auth.apiKey) {
      headers["X-Agent-API-Key"] = this.config.auth.apiKey;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonResponse = (await response.json()) as JSONRPCResponse;

      if (jsonResponse.error) {
        throw new Error(
          `JSON-RPC Error ${jsonResponse.error.code}: ${jsonResponse.error.message}`
        );
      }

      return jsonResponse;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Send a message to another agent
   */
  async sendMessage(
    targetAgentId: string,
    text: string,
    taskId?: string
  ): Promise<A2ATask> {
    const message = createA2AMessage("user", text, taskId);

    const params: MessageSendParams = {
      message,
      stream: false,
    };

    const request = createJSONRPCRequest("message/send", params);

    console.log(`📤 Sending message to agent ${targetAgentId}`);
    console.log(`   From: ${this.config.agentId}`);
    console.log(`   Message: ${text.substring(0, 100)}...`);

    const response = await this.sendRequest(targetAgentId, request);

    const task: A2ATask = response.result.task;

    console.log(`✅ Message sent, task created: ${task.id}`);

    return task;
  }

  /**
   * Send a custom message object to another agent
   */
  async sendCustomMessage(
    targetAgentId: string,
    message: A2AMessage
  ): Promise<A2ATask> {
    const params: MessageSendParams = {
      message,
      stream: false,
    };

    const request = createJSONRPCRequest("message/send", params);

    console.log(`📤 Sending custom message to agent ${targetAgentId}`);

    const response = await this.sendRequest(targetAgentId, request);

    const task: A2ATask = response.result.task;

    console.log(`✅ Custom message sent, task created: ${task.id}`);

    return task;
  }

  /**
   * Get task status
   */
  async getTask(taskId: string, targetAgentId: string): Promise<A2ATask> {
    const params: TaskGetParams = {
      id: taskId,
    };

    const request = createJSONRPCRequest("tasks/get", params);

    const response = await this.sendRequest(targetAgentId, request);

    const task: A2ATask = response.result.task;

    return task;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string, targetAgentId: string): Promise<A2ATask> {
    const params: TaskCancelParams = {
      id: taskId,
    };

    const request = createJSONRPCRequest("tasks/cancel", params);

    console.log(`🚫 Cancelling task ${taskId} on agent ${targetAgentId}`);

    const response = await this.sendRequest(targetAgentId, request);

    const task: A2ATask = response.result.task;

    console.log(`✅ Task cancelled: ${task.id}`);

    return task;
  }

  /**
   * List tasks
   */
  async listTasks(
    targetAgentId: string,
    params?: TaskListParams
  ): Promise<TaskListResponse> {
    const request = createJSONRPCRequest("tasks/list", params || {});

    const response = await this.sendRequest(targetAgentId, request);

    const result: TaskListResponse = response.result;

    return result;
  }

  /**
   * Wait for task completion
   * Polls task status until it's completed, failed, or cancelled
   */
  async waitForTask(
    taskId: string,
    targetAgentId: string,
    options?: {
      pollInterval?: number;
      maxAttempts?: number;
    }
  ): Promise<A2ATask> {
    const pollInterval = options?.pollInterval || 1000; // 1 second
    const maxAttempts = options?.maxAttempts || 60; // 60 attempts = 1 minute

    console.log(`⏳ Waiting for task ${taskId} to complete...`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const task = await this.getTask(taskId, targetAgentId);

      if (
        task.status.state === "completed" ||
        task.status.state === "failed" ||
        task.status.state === "cancelled"
      ) {
        console.log(`✅ Task ${taskId} finished with state: ${task.status.state}`);
        return task;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Task ${taskId} did not complete within timeout`);
  }

  /**
   * Send message and wait for response
   * Convenience method that combines sendMessage and waitForTask
   */
  async sendAndWait(
    targetAgentId: string,
    text: string,
    options?: {
      pollInterval?: number;
      maxAttempts?: number;
    }
  ): Promise<A2ATask> {
    const task = await this.sendMessage(targetAgentId, text);
    return await this.waitForTask(task.id, targetAgentId, options);
  }

  /**
   * Negotiate with another agent
   * Sends a negotiation offer and waits for response
   */
  async negotiate(
    targetAgentId: string,
    productId: string,
    offeredPrice: number,
    message?: string
  ): Promise<A2ATask> {
    const negotiationMessage = message || `I'd like to purchase product ${productId} for $${offeredPrice}`;

    const customMessage = createA2AMessage("user", negotiationMessage);
    customMessage.parts.push({
      kind: "text",
      text: JSON.stringify({
        type: "negotiation_offer",
        productId,
        offeredPrice,
        round: 1,
      }),
    });

    const task = await this.sendCustomMessage(targetAgentId, customMessage);

    console.log(`💬 Negotiation started for product ${productId}`);
    console.log(`   Offered price: $${offeredPrice}`);

    return task;
  }

  /**
   * Confirm delivery
   * Sends delivery confirmation to seller agent
   */
  async confirmDelivery(
    targetAgentId: string,
    escrowAddress: string,
    rating?: number
  ): Promise<A2ATask> {
    const confirmationMessage = createA2AMessage(
      "user",
      `Delivery confirmed for escrow ${escrowAddress}`
    );
    
    confirmationMessage.parts.push({
      kind: "text",
      text: JSON.stringify({
        type: "delivery_confirmation",
        escrowAddress,
        confirmed: true,
        rating,
      }),
    });

    const task = await this.sendCustomMessage(targetAgentId, confirmationMessage);

    console.log(`✅ Delivery confirmation sent for escrow ${escrowAddress}`);

    return task;
  }

  /**
   * Request product listing
   * Asks seller agent for available products
   */
  async requestListings(
    targetAgentId: string,
    category?: string
  ): Promise<A2ATask> {
    const message = category
      ? `Show me products in category: ${category}`
      : "Show me all available products";

    const task = await this.sendMessage(targetAgentId, message);

    console.log(`📋 Requested product listings from agent ${targetAgentId}`);

    return task;
  }
}

/**
 * Create A2A client for buyer agent
 */
export function createBuyerClient(baseUrl: string = "http://localhost:3000"): A2AClient {
  return new A2AClient({
    baseUrl,
    agentId: process.env.BUYER_AGENT_ID || "27",
    auth: {
      type: "api-key",
      apiKey: process.env.BUYER_API_KEY || "buyer-test-key",
    },
  });
}

/**
 * Create A2A client for seller agent
 */
export function createSellerClient(baseUrl: string = "http://localhost:3000"): A2AClient {
  return new A2AClient({
    baseUrl,
    agentId: process.env.SELLER_AGENT_ID || "28",
    auth: {
      type: "api-key",
      apiKey: process.env.SELLER_API_KEY || "seller-test-key",
    },
  });
}
