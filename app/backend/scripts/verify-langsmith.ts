/**
 * Verify LangSmith Configuration
 * 
 * This script checks if LangSmith tracing is properly configured
 * and sends a test trace to verify connectivity.
 */

import dotenv from 'dotenv';
import { ChatGroq } from "@langchain/groq";

dotenv.config();

async function verifyLangSmith() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 LANGSMITH CONFIGURATION VERIFICATION');
  console.log('='.repeat(70));
  console.log('');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   LANGCHAIN_TRACING_V2: ${process.env.LANGCHAIN_TRACING_V2}`);
  console.log(`   LANGCHAIN_API_KEY: ${process.env.LANGCHAIN_API_KEY ? '✅ Set (hidden)' : '❌ Not set'}`);
  console.log(`   LANGCHAIN_PROJECT: ${process.env.LANGCHAIN_PROJECT}`);
  console.log(`   LANGCHAIN_ENDPOINT: ${process.env.LANGCHAIN_ENDPOINT}`);
  console.log('');

  // Verify values
  const issues: string[] = [];
  
  if (process.env.LANGCHAIN_TRACING_V2 !== 'true') {
    issues.push('LANGCHAIN_TRACING_V2 must be "true"');
  }
  
  if (!process.env.LANGCHAIN_API_KEY) {
    issues.push('LANGCHAIN_API_KEY is not set');
  }
  
  if (!process.env.LANGCHAIN_PROJECT) {
    issues.push('LANGCHAIN_PROJECT is not set');
  }

  if (issues.length > 0) {
    console.log('❌ Configuration Issues:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
    console.log('💡 Fix these issues in your .env file');
    process.exit(1);
  }

  console.log('✅ All environment variables are set correctly!');
  console.log('');

  // Test LangSmith connectivity
  console.log('🧪 Testing LangSmith connectivity...');
  console.log('   Sending a test LLM call to create a trace...');
  console.log('');

  try {
    const llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const response = await llm.invoke([
      {
        role: "user",
        content: "Say 'LangSmith test successful!' in exactly those words."
      }
    ]);

    console.log('✅ LLM Response:', response.content);
    console.log('');
    console.log('='.repeat(70));
    console.log('✅ SUCCESS: LangSmith tracing should be working!');
    console.log('='.repeat(70));
    console.log('');
    console.log('🔗 View your trace at:');
    console.log(`   https://smith.langchain.com/`);
    console.log('');
    console.log('📋 Steps to view:');
    console.log(`   1. Go to https://smith.langchain.com/`);
    console.log(`   2. Select project: "${process.env.LANGCHAIN_PROJECT}"`);
    console.log('   3. Look for the most recent run (just now)');
    console.log('   4. You should see a ChatGroq invocation');
    console.log('');
    console.log('⏰ Note: Traces may take 5-10 seconds to appear in the UI');
    console.log('');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('💡 Possible issues:');
    console.log('   - Invalid LANGCHAIN_API_KEY');
    console.log('   - Network connectivity issues');
    console.log('   - LangSmith service is down');
    console.log('');
    console.log('🔗 Check your API key at:');
    console.log('   https://smith.langchain.com/settings');
    process.exit(1);
  }
}

verifyLangSmith()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

