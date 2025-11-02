/**
 * A2A (Agent-to-Agent) Client
 *
 * Client for communicating with other agents via A2A JSON-RPC protocol
 */
import { A2AMessage, A2ATask, A2AClientConfig, TaskListParams, TaskListResponse } from "../types/a2a.js";
/**
 * A2A Client Class
 * Provides methods to communicate with other agents
 */
export declare class A2AClient {
    private config;
    constructor(config: A2AClientConfig);
    /**
     * Send a JSON-RPC request to an agent
     */
    private sendRequest;
    /**
     * Send a message to another agent
     */
    sendMessage(targetAgentId: string, text: string, taskId?: string): Promise<A2ATask>;
    /**
     * Send a custom message object to another agent
     */
    sendCustomMessage(targetAgentId: string, message: A2AMessage): Promise<A2ATask>;
    /**
     * Get task status
     */
    getTask(taskId: string, targetAgentId: string): Promise<A2ATask>;
    /**
     * Cancel a task
     */
    cancelTask(taskId: string, targetAgentId: string): Promise<A2ATask>;
    /**
     * List tasks
     */
    listTasks(targetAgentId: string, params?: TaskListParams): Promise<TaskListResponse>;
    /**
     * Wait for task completion
     * Polls task status until it's completed, failed, or cancelled
     */
    waitForTask(taskId: string, targetAgentId: string, options?: {
        pollInterval?: number;
        maxAttempts?: number;
    }): Promise<A2ATask>;
    /**
     * Send message and wait for response
     * Convenience method that combines sendMessage and waitForTask
     */
    sendAndWait(targetAgentId: string, text: string, options?: {
        pollInterval?: number;
        maxAttempts?: number;
    }): Promise<A2ATask>;
    /**
     * Negotiate with another agent
     * Sends a negotiation offer and waits for response
     */
    negotiate(targetAgentId: string, productId: string, offeredPrice: number, message?: string): Promise<A2ATask>;
    /**
     * Confirm delivery
     * Sends delivery confirmation to seller agent
     */
    confirmDelivery(targetAgentId: string, escrowAddress: string, rating?: number): Promise<A2ATask>;
    /**
     * Request product listing
     * Asks seller agent for available products
     */
    requestListings(targetAgentId: string, category?: string): Promise<A2ATask>;
}
/**
 * Create A2A client for buyer agent
 */
export declare function createBuyerClient(baseUrl?: string): A2AClient;
/**
 * Create A2A client for seller agent
 */
export declare function createSellerClient(baseUrl?: string): A2AClient;
//# sourceMappingURL=a2aClient.d.ts.map