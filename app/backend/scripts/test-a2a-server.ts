/**
 * A2A Server Unit Test
 * 
 * Tests the A2A server directly without HTTP requests
 */

import { A2AServer } from "../src/api/a2aServer.js";
import {
  createJSONRPCRequest,
  createA2AMessage,
  MessageSendParams,
  TaskGetParams,
  TaskCancelParams,
} from "../src/types/a2a.js";

console.log("\n" + "=".repeat(70));
console.log("🧪 Testing A2A Server (Unit Tests)");
console.log("=".repeat(70) + "\n");

let totalTests = 0;
let passedTests = 0;

const server = new A2AServer();

// ========================================
// Test 1: Handle message/send
// ========================================
totalTests++;
console.log("📋 Test 1: Handle message/send");
console.log("-".repeat(70));

try {
  const message = createA2AMessage("user", "Hello, I want to buy a product");
  const params: MessageSendParams = { message };
  const request = createJSONRPCRequest("message/send", params, 1);

  const response = await server.handleMessageSend(request, "28");

  console.log(`✅ Response received`);
  console.log(`   Task ID: ${response.result?.task?.id}`);
  console.log(`   Status: ${response.result?.task?.status?.state}`);

  if (response.result && response.result.task && response.result.task.id) {
    passedTests++;
    console.log("✅ Test 1 PASSED\n");
  } else {
    console.error("❌ Test 1 FAILED: No task in response");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 1 FAILED:", error.message);
  console.log();
}

// Wait for async processing
await new Promise((resolve) => setTimeout(resolve, 1000));

// ========================================
// Test 2: Handle tasks/get
// ========================================
totalTests++;
console.log("📋 Test 2: Handle tasks/get");
console.log("-".repeat(70));

try {
  const allTasks = server.getAllTasks();
  
  if (allTasks.length === 0) {
    throw new Error("No tasks found");
  }

  const taskId = allTasks[0].id;
  const params: TaskGetParams = { id: taskId };
  const request = createJSONRPCRequest("tasks/get", params, 2);

  const response = server.handleTaskGet(request);

  console.log(`✅ Task retrieved`);
  console.log(`   Task ID: ${response.result?.task?.id}`);
  console.log(`   Status: ${response.result?.task?.status?.state}`);

  if (response.result && response.result.task) {
    passedTests++;
    console.log("✅ Test 2 PASSED\n");
  } else {
    console.error("❌ Test 2 FAILED: Could not get task");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 2 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 3: Handle tasks/list
// ========================================
totalTests++;
console.log("📋 Test 3: Handle tasks/list");
console.log("-".repeat(70));

try {
  const request = createJSONRPCRequest("tasks/list", {}, 3);

  const response = server.handleTaskList(request);

  console.log(`✅ Tasks listed`);
  console.log(`   Total: ${response.result?.total}`);
  console.log(`   Returned: ${response.result?.tasks?.length}`);

  if (response.result && response.result.tasks) {
    passedTests++;
    console.log("✅ Test 3 PASSED\n");
  } else {
    console.error("❌ Test 3 FAILED: Could not list tasks");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 3 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 4: Handle tasks/cancel
// ========================================
totalTests++;
console.log("📋 Test 4: Handle tasks/cancel");
console.log("-".repeat(70));

try {
  // Create a new task
  const message = createA2AMessage("user", "Test message for cancellation");
  const params: MessageSendParams = { message };
  const createRequest = createJSONRPCRequest("message/send", params, 4);

  const createResponse = await server.handleMessageSend(createRequest, "28");
  const taskId = createResponse.result?.task?.id;

  if (!taskId) {
    throw new Error("Failed to create task");
  }

  // Cancel the task immediately (before it completes)
  const cancelParams: TaskCancelParams = { id: taskId };
  const cancelRequest = createJSONRPCRequest("tasks/cancel", cancelParams, 5);

  const cancelResponse = server.handleTaskCancel(cancelRequest);

  console.log(`✅ Task cancellation attempted`);
  console.log(`   Task ID: ${cancelResponse.result?.task?.id}`);
  console.log(`   Status: ${cancelResponse.result?.task?.status?.state}`);

  // Task might be completed or cancelled depending on timing
  if (cancelResponse.result?.task?.status?.state === "cancelled" ||
      cancelResponse.result?.task?.status?.state === "completed") {
    passedTests++;
    console.log("✅ Test 4 PASSED\n");
  } else {
    console.error("❌ Test 4 FAILED: Unexpected task state");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 4 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 5: Message Handler Registration
// ========================================
totalTests++;
console.log("📋 Test 5: Message Handler Registration");
console.log("-".repeat(70));

try {
  // Register a custom message handler
  server.registerMessageHandler("27", async (message, agentId) => {
    return createA2AMessage(
      "agent",
      `Custom response to: ${message.parts[0]?.text}`,
      message.taskId
    );
  });

  // Send a message to trigger the handler
  const message = createA2AMessage("user", "Test custom handler");
  const params: MessageSendParams = { message };
  const request = createJSONRPCRequest("message/send", params, 6);

  const response = await server.handleMessageSend(request, "27");

  console.log(`✅ Message sent to agent with custom handler`);
  console.log(`   Task ID: ${response.result?.task?.id}`);

  // Wait for processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get the task to check the response
  const taskId = response.result?.task?.id;
  const getParams: TaskGetParams = { id: taskId };
  const getRequest = createJSONRPCRequest("tasks/get", getParams, 7);

  const getResponse = server.handleTaskGet(getRequest);
  const responseText = getResponse.result?.task?.status?.message?.parts[0]?.text;

  console.log(`   Response: ${responseText}`);

  if (responseText && responseText.includes("Custom response")) {
    passedTests++;
    console.log("✅ Test 5 PASSED\n");
  } else {
    console.error("❌ Test 5 FAILED: Custom handler not working");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 5 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 6: Error Handling - Invalid Params
// ========================================
totalTests++;
console.log("📋 Test 6: Error Handling - Invalid Params");
console.log("-".repeat(70));

try {
  // Send request with missing params
  const request = createJSONRPCRequest("message/send", {}, 8);

  const response = await server.handleMessageSend(request, "28");

  console.log(`✅ Error response received`);
  console.log(`   Error code: ${response.error?.code}`);
  console.log(`   Error message: ${response.error?.message}`);

  if (response.error && response.error.code === -32602) {
    passedTests++;
    console.log("✅ Test 6 PASSED\n");
  } else {
    console.error("❌ Test 6 FAILED: Expected error response");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 6 FAILED:", error.message);
  console.log();
}

// ========================================
// Test 7: Error Handling - Task Not Found
// ========================================
totalTests++;
console.log("📋 Test 7: Error Handling - Task Not Found");
console.log("-".repeat(70));

try {
  const params: TaskGetParams = { id: "nonexistent-task-id" };
  const request = createJSONRPCRequest("tasks/get", params, 9);

  const response = server.handleTaskGet(request);

  console.log(`✅ Error response received`);
  console.log(`   Error code: ${response.error?.code}`);
  console.log(`   Error message: ${response.error?.message}`);

  if (response.error && response.error.code === -32001) {
    passedTests++;
    console.log("✅ Test 7 PASSED\n");
  } else {
    console.error("❌ Test 7 FAILED: Expected task not found error");
    console.log();
  }
} catch (error: any) {
  console.error("❌ Test 7 FAILED:", error.message);
  console.log();
}

// ========================================
// Test Summary
// ========================================
console.log("=".repeat(70));
console.log("📊 Test Summary");
console.log("=".repeat(70));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log("=".repeat(70));

if (passedTests === totalTests) {
  console.log("\n🎉 All tests passed! A2A server is working!\n");
  process.exit(0);
} else {
  console.log("\n⚠️  Some tests failed. Please review the errors above.\n");
  process.exit(1);
}

