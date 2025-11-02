/**
 * A2A (Agent-to-Agent) Protocol Type Definitions
 *
 * Implements A2A Protocol 0.3.0 specification
 * https://a2a-protocol.org/latest/specification/
 */
/**
 * JSON-RPC 2.0 Request
 */
export interface JSONRPCRequest {
    jsonrpc: "2.0";
    method: string;
    params?: any;
    id: string | number | null;
}
/**
 * JSON-RPC 2.0 Response
 */
export interface JSONRPCResponse {
    jsonrpc: "2.0";
    result?: any;
    error?: JSONRPCError;
    id: string | number | null;
}
/**
 * JSON-RPC 2.0 Error
 */
export interface JSONRPCError {
    code: number;
    message: string;
    data?: any;
}
/**
 * Standard JSON-RPC Error Codes
 */
export declare enum JSONRPCErrorCode {
    PARSE_ERROR = -32700,
    INVALID_REQUEST = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_PARAMS = -32602,
    INTERNAL_ERROR = -32603,
    TASK_NOT_FOUND = -32001,
    UNAUTHORIZED = -32002,
    AGENT_NOT_FOUND = -32003,
    INVALID_MESSAGE = -32004
}
/**
 * A2A Message Part
 */
export interface A2AMessagePart {
    kind: "text" | "image" | "audio" | "video" | "file";
    text?: string;
    url?: string;
    mimeType?: string;
    data?: string;
}
/**
 * A2A Message
 */
export interface A2AMessage {
    role: "user" | "agent";
    parts: A2AMessagePart[];
    messageId?: string;
    taskId?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
}
/**
 * A2A Task Status
 */
export interface A2ATaskStatus {
    state: "pending" | "working" | "completed" | "failed" | "cancelled";
    message?: A2AMessage;
    result?: any;
    error?: string;
    progress?: number;
}
/**
 * A2A Task
 */
export interface A2ATask {
    id: string;
    status: A2ATaskStatus;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, any>;
}
/**
 * A2A Message Send Request Parameters
 */
export interface MessageSendParams {
    message: A2AMessage;
    stream?: boolean;
}
/**
 * A2A Task Get Request Parameters
 */
export interface TaskGetParams {
    id: string;
}
/**
 * A2A Task Cancel Request Parameters
 */
export interface TaskCancelParams {
    id: string;
}
/**
 * A2A Task List Request Parameters
 */
export interface TaskListParams {
    limit?: number;
    offset?: number;
    state?: A2ATaskStatus["state"];
}
/**
 * A2A Task List Response
 */
export interface TaskListResponse {
    tasks: A2ATask[];
    total: number;
    limit: number;
    offset: number;
}
/**
 * A2A Message Send Response
 */
export interface MessageSendResponse {
    task: A2ATask;
}
/**
 * A2A Task Get Response
 */
export interface TaskGetResponse {
    task: A2ATask;
}
/**
 * A2A Task Cancel Response
 */
export interface TaskCancelResponse {
    task: A2ATask;
}
/**
 * A2A Streaming Event
 */
export interface A2AStreamEvent {
    event: "message" | "progress" | "complete" | "error";
    data: any;
    taskId: string;
    timestamp: string;
}
/**
 * A2A Authentication
 */
export interface A2AAuth {
    type: "bearer" | "api-key" | "none";
    token?: string;
    apiKey?: string;
}
/**
 * A2A Client Configuration
 */
export interface A2AClientConfig {
    baseUrl: string;
    agentId: string;
    auth: A2AAuth;
    timeout?: number;
}
/**
 * Negotiation Offer (for marketplace agents)
 */
export interface NegotiationOffer {
    round: number;
    offeredPrice: number;
    message: string;
    timestamp: string;
    productId?: string;
}
/**
 * Negotiation Response (for marketplace agents)
 */
export interface NegotiationResponse {
    status: "accept" | "counter" | "reject";
    message: string;
    counterOffer?: number;
    finalPrice?: number;
    timestamp: string;
}
/**
 * Product Listing (for marketplace agents)
 */
export interface ProductListing {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    sellerAgentId: string;
    sellerAddress: string;
    imageUrl?: string;
    category?: string;
    condition?: "new" | "like-new" | "good" | "fair" | "poor";
    metadata?: Record<string, any>;
}
/**
 * Purchase Request (for marketplace agents)
 */
export interface PurchaseRequest {
    productId: string;
    offeredPrice: number;
    buyerAgentId: string;
    buyerAddress: string;
    message?: string;
}
/**
 * Purchase Response (for marketplace agents)
 */
export interface PurchaseResponse {
    status: "accepted" | "negotiating" | "rejected";
    escrowAddress?: string;
    finalPrice?: number;
    message?: string;
    negotiationTaskId?: string;
}
/**
 * Delivery Confirmation (for marketplace agents)
 */
export interface DeliveryConfirmation {
    escrowAddress: string;
    buyerAgentId: string;
    confirmed: boolean;
    message?: string;
    rating?: number;
}
/**
 * Shipment Notification (for marketplace agents)
 */
export interface ShipmentNotification {
    escrowAddress: string;
    sellerAgentId: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
    message?: string;
}
/**
 * Helper function to create JSON-RPC request
 */
export declare function createJSONRPCRequest(method: string, params?: any, id?: string | number): JSONRPCRequest;
/**
 * Helper function to create JSON-RPC success response
 */
export declare function createJSONRPCResponse(result: any, id: string | number | null): JSONRPCResponse;
/**
 * Helper function to create JSON-RPC error response
 */
export declare function createJSONRPCError(code: number, message: string, id: string | number | null, data?: any): JSONRPCResponse;
/**
 * Helper function to create A2A message
 */
export declare function createA2AMessage(role: "user" | "agent", text: string, taskId?: string): A2AMessage;
/**
 * Helper function to create A2A task
 */
export declare function createA2ATask(message: A2AMessage, state?: A2ATaskStatus["state"]): A2ATask;
//# sourceMappingURL=a2a.d.ts.map