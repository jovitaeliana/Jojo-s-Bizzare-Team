/**
 * A2A (Agent-to-Agent) JSON-RPC 2.0 Server
 *
 * Implements A2A Protocol 0.3.0 specification
 * Provides endpoints for agent-to-agent communication
 */
import { Router } from "express";
import { JSONRPCRequest, JSONRPCResponse, A2ATask, A2AMessage } from "../types/a2a.js";
/**
 * A2A Server Class
 * Handles JSON-RPC 2.0 requests for agent communication
 */
export declare class A2AServer {
    private tasks;
    private messageHandlers;
    /**
     * Register a message handler for a specific agent
     */
    registerMessageHandler(agentId: string, handler: (message: A2AMessage, agentId: string) => Promise<A2AMessage>): void;
    /**
     * Handle message/send method
     * Creates a task and processes the message
     */
    handleMessageSend(req: JSONRPCRequest, agentId: string): Promise<JSONRPCResponse>;
    /**
     * Process message and update task status
     */
    private processMessage;
    /**
     * Handle tasks/get method
     * Retrieves task status by ID
     */
    handleTaskGet(req: JSONRPCRequest): JSONRPCResponse;
    /**
     * Handle tasks/cancel method
     * Cancels a running task
     */
    handleTaskCancel(req: JSONRPCRequest): JSONRPCResponse;
    /**
     * Handle tasks/list method
     * Lists all tasks with optional filtering
     */
    handleTaskList(req: JSONRPCRequest): JSONRPCResponse;
    /**
     * Get all tasks (for debugging)
     */
    getAllTasks(): A2ATask[];
    /**
     * Clear all tasks (for testing)
     */
    clearTasks(): void;
}
/**
 * Create Express router for A2A endpoints
 */
export declare function createA2ARouter(server: A2AServer): Router;
export declare const a2aServer: A2AServer;
//# sourceMappingURL=a2aServer.d.ts.map