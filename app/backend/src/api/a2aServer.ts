/**
 * A2A (Agent-to-Agent) JSON-RPC 2.0 Server
 * 
 * Implements A2A Protocol 0.3.0 specification
 * Provides endpoints for agent-to-agent communication
 */

import express, { Request, Response, Router } from "express";
import {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCErrorCode,
  A2ATask,
  A2AMessage,
  MessageSendParams,
  TaskGetParams,
  TaskCancelParams,
  TaskListParams,
  TaskListResponse,
  createJSONRPCResponse,
  createJSONRPCError,
  createA2ATask,
  createA2AMessage,
} from "../types/a2a.js";

/**
 * A2A Server Class
 * Handles JSON-RPC 2.0 requests for agent communication
 */
export class A2AServer {
  private tasks: Map<string, A2ATask> = new Map();
  private messageHandlers: Map<string, (message: A2AMessage, agentId: string) => Promise<A2AMessage>> = new Map();

  /**
   * Register a message handler for a specific agent
   */
  registerMessageHandler(
    agentId: string,
    handler: (message: A2AMessage, agentId: string) => Promise<A2AMessage>
  ): void {
    this.messageHandlers.set(agentId, handler);
    console.log(`📋 Registered message handler for agent ${agentId}`);
  }

  /**
   * Handle message/send method
   * Creates a task and processes the message
   */
  async handleMessageSend(req: JSONRPCRequest, agentId: string): Promise<JSONRPCResponse> {
    try {
      const params = req.params as MessageSendParams;
      
      if (!params || !params.message) {
        return createJSONRPCError(
          JSONRPCErrorCode.INVALID_PARAMS,
          "Invalid params: message required",
          req.id
        );
      }

      const message = params.message;
      
      // Create task
      const task = createA2ATask(message, "working");
      this.tasks.set(task.id, task);

      console.log(`📨 Message received for agent ${agentId}`);
      console.log(`   Task ID: ${task.id}`);
      console.log(`   Message: ${message.parts[0]?.text?.substring(0, 100)}...`);

      // Process message asynchronously
      this.processMessage(task.id, message, agentId).catch((error) => {
        console.error(`❌ Message processing failed for task ${task.id}:`, error.message);
        const failedTask = this.tasks.get(task.id);
        if (failedTask) {
          failedTask.status.state = "failed";
          failedTask.status.error = error.message;
          failedTask.updated_at = new Date().toISOString();
        }
      });

      return createJSONRPCResponse({ task }, req.id);
    } catch (error: any) {
      return createJSONRPCError(
        JSONRPCErrorCode.INTERNAL_ERROR,
        error.message,
        req.id
      );
    }
  }

  /**
   * Process message and update task status
   */
  private async processMessage(taskId: string, message: A2AMessage, agentId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      // Get message handler for this agent
      const handler = this.messageHandlers.get(agentId);
      
      if (handler) {
        // Call agent-specific handler
        const response = await handler(message, agentId);
        
        task.status.state = "completed";
        task.status.message = response;
        task.status.result = {
          response: response.parts[0]?.text,
          messageId: response.messageId,
        };
      } else {
        // Default echo response
        const response = createA2AMessage(
          "agent",
          `Received: ${message.parts[0]?.text}`,
          taskId
        );
        
        task.status.state = "completed";
        task.status.message = response;
        task.status.result = {
          response: response.parts[0]?.text,
          messageId: response.messageId,
        };
      }

      task.updated_at = new Date().toISOString();
      console.log(`✅ Task ${taskId} completed`);
    } catch (error: any) {
      task.status.state = "failed";
      task.status.error = error.message;
      task.updated_at = new Date().toISOString();
      console.error(`❌ Task ${taskId} failed:`, error.message);
    }
  }

  /**
   * Handle tasks/get method
   * Retrieves task status by ID
   */
  handleTaskGet(req: JSONRPCRequest): JSONRPCResponse {
    try {
      const params = req.params as TaskGetParams;
      
      if (!params || !params.id) {
        return createJSONRPCError(
          JSONRPCErrorCode.INVALID_PARAMS,
          "Invalid params: id required",
          req.id
        );
      }

      const task = this.tasks.get(params.id);
      
      if (!task) {
        return createJSONRPCError(
          JSONRPCErrorCode.TASK_NOT_FOUND,
          `Task not found: ${params.id}`,
          req.id
        );
      }

      return createJSONRPCResponse({ task }, req.id);
    } catch (error: any) {
      return createJSONRPCError(
        JSONRPCErrorCode.INTERNAL_ERROR,
        error.message,
        req.id
      );
    }
  }

  /**
   * Handle tasks/cancel method
   * Cancels a running task
   */
  handleTaskCancel(req: JSONRPCRequest): JSONRPCResponse {
    try {
      const params = req.params as TaskCancelParams;
      
      if (!params || !params.id) {
        return createJSONRPCError(
          JSONRPCErrorCode.INVALID_PARAMS,
          "Invalid params: id required",
          req.id
        );
      }

      const task = this.tasks.get(params.id);
      
      if (!task) {
        return createJSONRPCError(
          JSONRPCErrorCode.TASK_NOT_FOUND,
          `Task not found: ${params.id}`,
          req.id
        );
      }

      // Only cancel if task is pending or working
      if (task.status.state === "pending" || task.status.state === "working") {
        task.status.state = "cancelled";
        task.updated_at = new Date().toISOString();
        console.log(`🚫 Task ${params.id} cancelled`);
      }

      return createJSONRPCResponse({ task }, req.id);
    } catch (error: any) {
      return createJSONRPCError(
        JSONRPCErrorCode.INTERNAL_ERROR,
        error.message,
        req.id
      );
    }
  }

  /**
   * Handle tasks/list method
   * Lists all tasks with optional filtering
   */
  handleTaskList(req: JSONRPCRequest): JSONRPCResponse {
    try {
      const params = (req.params as TaskListParams) || {};
      const limit = params.limit || 10;
      const offset = params.offset || 0;
      const state = params.state;

      let tasks = Array.from(this.tasks.values());

      // Filter by state if provided
      if (state) {
        tasks = tasks.filter((task) => task.status.state === state);
      }

      // Sort by created_at descending
      tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const total = tasks.length;
      const paginatedTasks = tasks.slice(offset, offset + limit);

      const response: TaskListResponse = {
        tasks: paginatedTasks,
        total,
        limit,
        offset,
      };

      return createJSONRPCResponse(response, req.id);
    } catch (error: any) {
      return createJSONRPCError(
        JSONRPCErrorCode.INTERNAL_ERROR,
        error.message,
        req.id
      );
    }
  }

  /**
   * Get all tasks (for debugging)
   */
  getAllTasks(): A2ATask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Clear all tasks (for testing)
   */
  clearTasks(): void {
    this.tasks.clear();
    console.log("🗑️  All tasks cleared");
  }
}

/**
 * Create Express router for A2A endpoints
 */
export function createA2ARouter(server: A2AServer): Router {
  const router = Router();

  /**
   * Authentication middleware
   * Validates X-Agent-API-Key header
   */
  const authenticateAPIKey = (req: Request, res: Response, next: any) => {
    const apiKey = req.headers["x-agent-api-key"];
    
    if (!apiKey) {
      return res.status(401).json(
        createJSONRPCError(
          JSONRPCErrorCode.UNAUTHORIZED,
          "Missing X-Agent-API-Key header",
          null
        )
      );
    }

    // In production, validate API key against database
    // For now, accept any non-empty key
    if (typeof apiKey !== "string" || apiKey.length === 0) {
      return res.status(401).json(
        createJSONRPCError(
          JSONRPCErrorCode.UNAUTHORIZED,
          "Invalid API key",
          null
        )
      );
    }

    next();
  };

  /**
   * A2A JSON-RPC endpoint
   * POST /api/a2a/:agentId
   */
  router.post("/api/a2a/:agentId", authenticateAPIKey, async (req: Request, res: Response) => {
    const { agentId } = req.params;
    const rpcRequest: JSONRPCRequest = req.body;

    // Validate JSON-RPC request
    if (!rpcRequest || rpcRequest.jsonrpc !== "2.0" || !rpcRequest.method) {
      return res.status(400).json(
        createJSONRPCError(
          JSONRPCErrorCode.INVALID_REQUEST,
          "Invalid JSON-RPC 2.0 request",
          rpcRequest?.id || null
        )
      );
    }

    let response: JSONRPCResponse;

    // Route to appropriate handler
    switch (rpcRequest.method) {
      case "message/send":
        response = await server.handleMessageSend(rpcRequest, agentId);
        break;
      case "tasks/get":
        response = server.handleTaskGet(rpcRequest);
        break;
      case "tasks/cancel":
        response = server.handleTaskCancel(rpcRequest);
        break;
      case "tasks/list":
        response = server.handleTaskList(rpcRequest);
        break;
      default:
        response = createJSONRPCError(
          JSONRPCErrorCode.METHOD_NOT_FOUND,
          `Method not found: ${rpcRequest.method}`,
          rpcRequest.id
        );
    }

    res.json(response);
  });

  return router;
}

// Export singleton instance
export const a2aServer = new A2AServer();

