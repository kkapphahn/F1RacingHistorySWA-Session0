/**
 * Local Test Script for Databricks Genie API Integration
 * 
 * This script tests the Azure Function locally without deploying.
 * It validates all three API operations: start-conversation, send-message, poll-result
 * 
 * PREREQUISITES:
 * 1. Install dependencies: npm install
 * 2. Create local.settings.json with your Databricks credentials
 * 3. Start Azure Functions locally: func start
 * 
 * USAGE:
 * node test-genie-local.js
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:7071/api/genie';
const TEST_QUERY = 'Show me the top 5 drivers';

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'bright');
    console.log('='.repeat(60));
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
    logSection('TEST 1: Health Check (GET /api/genie)');
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            logSuccess('Health check passed');
            logInfo(`Message: ${data.message}`);
            logInfo(`Timestamp: ${data.timestamp}`);
            return true;
        } else {
            logError('Health check failed');
            console.log('Response:', data);
            return false;
        }
    } catch (error) {
        logError(`Health check error: ${error.message}`);
        logWarning('Make sure Azure Functions is running: func start');
        return false;
    }
}

/**
 * Test 2: Start Conversation
 */
async function testStartConversation() {
    logSection('TEST 2: Start Conversation');
    
    try {
        logInfo('Calling start-conversation...');
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'start-conversation'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            logSuccess('Conversation started successfully');
            logInfo(`Conversation ID: ${result.data.conversation_id}`);
            logInfo(`Space ID: ${result.data.space_id}`);
            logInfo(`Created: ${new Date(result.data.created_timestamp * 1000).toLocaleString()}`);
            return result.data.conversation_id;
        } else {
            logError('Failed to start conversation');
            console.log('Error:', result.error);
            return null;
        }
    } catch (error) {
        logError(`Exception: ${error.message}`);
        return null;
    }
}

/**
 * Test 3: Send Message
 */
async function testSendMessage(conversationId) {
    logSection('TEST 3: Send Message');
    
    if (!conversationId) {
        logError('No conversation ID provided - skipping test');
        return null;
    }
    
    try {
        logInfo(`Query: "${TEST_QUERY}"`);
        logInfo('Sending message...');
        
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'send-message',
                conversationId: conversationId,
                content: TEST_QUERY
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            logSuccess('Message sent successfully');
            logInfo(`Message ID: ${result.data.id}`);
            logInfo(`Status: ${result.data.status}`);
            return result.data.id;
        } else {
            logError('Failed to send message');
            console.log('Error:', result.error);
            return null;
        }
    } catch (error) {
        logError(`Exception: ${error.message}`);
        return null;
    }
}

/**
 * Test 4: Poll for Result (with exponential backoff)
 */
async function testPollResult(conversationId, messageId) {
    logSection('TEST 4: Poll for Result');
    
    if (!conversationId || !messageId) {
        logError('Missing conversation ID or message ID - skipping test');
        return null;
    }
    
    const delays = [500, 1000, 2000, 5000];
    const maxAttempts = 30; // 60 seconds total
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const delay = delays[Math.min(attempt, delays.length - 1)];
            logInfo(`Poll attempt ${attempt + 1}/${maxAttempts} (waiting ${delay}ms)...`);
            
            await sleep(delay);
            
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'poll-result',
                    conversationId: conversationId,
                    messageId: messageId
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                logError('Poll failed');
                console.log('Error:', result.error);
                return null;
            }
            
            const status = result.data.status;
            log(`Status: ${status}`, status === 'COMPLETED' ? 'green' : 'yellow');
            
            // Check if still processing
            if (status === 'EXECUTING' || status === 'FILTERING_CONTEXT' || status === 'QUERY_RESULT_EXPIRED') {
                continue; // Keep polling
            } else if (status === 'COMPLETED') {
                logSuccess('Query completed!');
                return result.data;
            } else if (status === 'FAILED') {
                logError('Query failed');
                console.log('Failure details:', result.data);
                return null;
            } else {
                logWarning(`Unknown status: ${status}`);
                continue;
            }
        } catch (error) {
            logError(`Exception during poll: ${error.message}`);
            return null;
        }
    }
    
    logError('Timeout: Query took too long to complete');
    return null;
}

/**
 * Test 5: Validate Result Data
 */
function testValidateResult(result) {
    logSection('TEST 5: Validate Result Data Structure');
    
    if (!result) {
        logError('No result data to validate');
        return false;
    }
    
    try {
        // Check for attachments
        if (!result.attachments || result.attachments.length === 0) {
            logWarning('No attachments found in result');
            console.log('Result structure:', JSON.stringify(result, null, 2));
            return false;
        }
        
        logSuccess(`Found ${result.attachments.length} attachment(s)`);
        
        const attachment = result.attachments[0];
        
        // Check for query result
        if (attachment.query && attachment.query.query_result) {
            const queryResult = attachment.query.query_result;
            
            logSuccess('Query result found');
            logInfo(`Row count: ${queryResult.row_count}`);
            logInfo(`Columns: ${queryResult.schema?.columns?.length || 0}`);
            logInfo(`Truncated: ${queryResult.truncated}`);
            
            // Display column names
            if (queryResult.schema && queryResult.schema.columns) {
                console.log('\n📋 Column Schema:');
                queryResult.schema.columns.forEach((col, i) => {
                    console.log(`  ${i + 1}. ${col.name} (${col.type})`);
                });
            }
            
            // Display sample data
            if (queryResult.data_array && queryResult.data_array.length > 0) {
                console.log('\n📊 Sample Data (first 3 rows):');
                queryResult.data_array.slice(0, 3).forEach((row, i) => {
                    console.log(`  Row ${i + 1}:`, row);
                });
                logSuccess('Data validation passed');
            } else {
                logWarning('No data rows found');
            }
            
            // Display generated SQL
            if (attachment.query.query) {
                console.log('\n🔍 Generated SQL:');
                console.log(attachment.query.query);
            }
            
            return true;
        } else {
            logError('No query result found in attachment');
            console.log('Attachment structure:', JSON.stringify(attachment, null, 2));
            return false;
        }
    } catch (error) {
        logError(`Validation error: ${error.message}`);
        console.log('Result:', JSON.stringify(result, null, 2));
        return false;
    }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
    log('\n🧪 DATABRICKS GENIE API - LOCAL TEST SUITE', 'bright');
    log(`Query: "${TEST_QUERY}"`, 'cyan');
    
    const startTime = Date.now();
    
    // Test 1: Health Check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        logError('\n❌ Tests aborted - API is not responding');
        process.exit(1);
    }
    
    // Test 2: Start Conversation
    const conversationId = await testStartConversation();
    if (!conversationId) {
        logError('\n❌ Tests aborted - Could not start conversation');
        logWarning('Check your environment variables in local.settings.json:');
        logWarning('  - DATABRICKS_WORKSPACE_URL');
        logWarning('  - DATABRICKS_PAT_TOKEN');
        logWarning('  - GENIE_SPACE_ID');
        process.exit(1);
    }
    
    // Test 3: Send Message
    const messageId = await testSendMessage(conversationId);
    if (!messageId) {
        logError('\n❌ Tests aborted - Could not send message');
        process.exit(1);
    }
    
    // Test 4: Poll for Result
    const result = await testPollResult(conversationId, messageId);
    if (!result) {
        logError('\n❌ Tests aborted - Could not get result');
        process.exit(1);
    }
    
    // Test 5: Validate Result
    const isValid = testValidateResult(result);
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logSection('TEST SUMMARY');
    if (isValid) {
        logSuccess(`All tests passed in ${duration} seconds! 🎉`);
        logInfo('Your Genie integration is working correctly');
        process.exit(0);
    } else {
        logError(`Tests completed with errors in ${duration} seconds`);
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
