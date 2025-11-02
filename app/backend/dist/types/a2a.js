/**
 * A2A (Agent-to-Agent) Protocol Type Definitions
 *
 * Implements A2A Protocol 0.3.0 specification
 * https://a2a-protocol.org/latest/specification/
 */
/**
 * Standard JSON-RPC Error Codes
 */
export var JSONRPCErrorCode;
(function (JSONRPCErrorCode) {
    JSONRPCErrorCode[JSONRPCErrorCode["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    JSONRPCErrorCode[JSONRPCErrorCode["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    JSONRPCErrorCode[JSONRPCErrorCode["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    JSONRPCErrorCode[JSONRPCErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    JSONRPCErrorCode[JSONRPCErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    // Custom error codes
    JSONRPCErrorCode[JSONRPCErrorCode["TASK_NOT_FOUND"] = -32001] = "TASK_NOT_FOUND";
    JSONRPCErrorCode[JSONRPCErrorCode["UNAUTHORIZED"] = -32002] = "UNAUTHORIZED";
    JSONRPCErrorCode[JSONRPCErrorCode["AGENT_NOT_FOUND"] = -32003] = "AGENT_NOT_FOUND";
    JSONRPCErrorCode[JSONRPCErrorCode["INVALID_MESSAGE"] = -32004] = "INVALID_MESSAGE";
})(JSONRPCErrorCode || (JSONRPCErrorCode = {}));
/**
 * Helper function to create JSON-RPC request
 */
export function createJSONRPCRequest(method, params, id) {
    return {
        jsonrpc: "2.0",
        method,
        params,
        id: id ?? Date.now(),
    };
}
/**
 * Helper function to create JSON-RPC success response
 */
export function createJSONRPCResponse(result, id) {
    return {
        jsonrpc: "2.0",
        result,
        id,
    };
}
/**
 * Helper function to create JSON-RPC error response
 */
export function createJSONRPCError(code, message, id, data) {
    return {
        jsonrpc: "2.0",
        error: {
            code,
            message,
            data,
        },
        id,
    };
}
/**
 * Helper function to create A2A message
 */
export function createA2AMessage(role, text, taskId) {
    return {
        role,
        parts: [{ kind: "text", text }],
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        taskId,
        timestamp: new Date().toISOString(),
    };
}
/**
 * Helper function to create A2A task
 */
export function createA2ATask(message, state = "pending") {
    const taskId = message.taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
        id: taskId,
        status: {
            state,
            message,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}
//# sourceMappingURL=a2a.js.map