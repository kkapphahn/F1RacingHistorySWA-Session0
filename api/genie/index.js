/**
 * Azure Function: Databricks Genie API Proxy
 * 
 * PURPOSE: This function acts as a secure proxy between your frontend and Databricks Genie API.
 * It keeps your Databricks credentials server-side and handles the conversation flow with Genie.
 * 
 * DATABRICKS GENIE API OVERVIEW:
 * Genie is a conversational AI that queries your data using natural language.
 * The API follows this flow:
 * 1. Create a conversation (or use existing one)
 * 2. Send a message (your question) to the conversation
 * 3. Poll the message until it's COMPLETED (Genie generates and runs SQL)
 * 4. Extract the query results from the completed message
 * 
 * KEY CONCEPTS:
 * - Space: A workspace containing your data context (tables, schemas)
 * - Conversation: A thread of messages that maintains context
 * - Message: A user question that Genie processes
 * - Attachment: Contains the query result data (rows, columns, SQL)
 */

const fetch = require('node-fetch');

module.exports = async function (context, req) {
    // Log the incoming request for debugging
    context.log('=== Genie API Request ===');
    context.log('Action:', req.body?.action);
    context.log('Body:', JSON.stringify(req.body, null, 2));

    // CORS headers - allow frontend to call this API
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers,
            body: ''
        };
        return;
    }

    // Handle GET request (for testing)
    if (req.method === 'GET') {
        context.res = {
            status: 200,
            headers,
            body: JSON.stringify({
                message: 'Genie API is running',
                method: 'Use POST with action parameter',
                timestamp: new Date().toISOString()
            })
        };
        return;
    }

    try {
        // === CONFIGURATION ===
        // These environment variables must be set in Azure Static Web Apps configuration
        const DATABRICKS_WORKSPACE_URL = process.env.DATABRICKS_WORKSPACE_URL; // e.g., https://adb-xxx.azuredatabricks.net
        const DATABRICKS_PAT_TOKEN = process.env.DATABRICKS_PAT_TOKEN;         // Personal Access Token
        const GENIE_SPACE_ID = process.env.GENIE_SPACE_ID;                     // Your Genie Space ID

        // Validate required environment variables
        if (!DATABRICKS_WORKSPACE_URL || !DATABRICKS_PAT_TOKEN || !GENIE_SPACE_ID) {
            throw new Error('Missing required environment variables. Please set DATABRICKS_WORKSPACE_URL, DATABRICKS_PAT_TOKEN, and GENIE_SPACE_ID');
        }

        // Extract action from request body (handle both parsed and unparsed body)
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                throw new Error('Invalid JSON in request body');
            }
        }
        
        const { action, conversationId, messageId, content } = body;

        // Route to appropriate handler based on action
        let result;
        switch (action) {
            case 'start-conversation':
                result = await startConversation(DATABRICKS_WORKSPACE_URL, DATABRICKS_PAT_TOKEN, GENIE_SPACE_ID, context);
                break;
            case 'send-message':
                result = await sendMessage(DATABRICKS_WORKSPACE_URL, DATABRICKS_PAT_TOKEN, GENIE_SPACE_ID, conversationId, content, context);
                break;
            case 'poll-result':
                result = await pollResult(DATABRICKS_WORKSPACE_URL, DATABRICKS_PAT_TOKEN, GENIE_SPACE_ID, conversationId, messageId, context);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        // Return success response
        const responseBody = JSON.stringify({
            success: true,
            data: result
        });
        
        context.res = {
            status: 200,
            headers,
            body: responseBody
        };

    } catch (error) {
        // Log detailed error for debugging
        context.log.error('=== Error in Genie API ===');
        context.log.error('Error message:', error.message);
        context.log.error('Stack trace:', error.stack);

        // Return user-friendly error response
        const errorBody = JSON.stringify({
            success: false,
            error: error.message,
            type: categorizeError(error)
        });
        
        context.res = {
            status: 500,
            headers,
            body: errorBody
        };
    }
};

/**
 * START CONVERSATION
 * 
 * PURPOSE: Creates a new conversation thread with Genie.
 * A conversation maintains context across multiple questions.
 * 
 * API ENDPOINT: POST /api/2.0/genie/spaces/{space_id}/start-conversation
 * 
 * REQUEST BODY: { "title": "Conversation title" }  // title is required
 * 
 * RESPONSE STRUCTURE:
 * {
 *   "conversation_id": "01ef1234-5678-9abc-def0-123456789abc",
 *   "space_id": "01ef-xxx",
 *   "title": null,
 *   "created_timestamp": 1234567890
 * }
 * 
 * WHY WE NEED THIS: The conversation_id is required for all subsequent messages.
 * It allows Genie to maintain context (e.g., "What about 2023?" after asking about 2022).
 */
async function startConversation(workspaceUrl, token, spaceId, context) {
    const url = `${workspaceUrl}/api/2.0/genie/spaces/${spaceId}/start-conversation`;
    
    // Try different variations of the request body based on Databricks API requirements
    const requestBody = {
        content: 'F1 Racing History Chat',  // Some versions use 'content'
        title: 'F1 Racing History Chat'     // Some versions use 'title'
    };
    
    context.log('=== Starting Conversation ===');
    context.log('URL:', url);
    context.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        context.log.error('Failed to start conversation');
        context.log.error('Status:', response.status);
        context.log.error('Response:', errorText);
        context.log.error('Request body was:', JSON.stringify(requestBody, null, 2));
        throw new Error(`Failed to start conversation: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    context.log('✅ Conversation started successfully!');
    context.log('Conversation ID:', data.conversation_id);
    context.log('Full response:', JSON.stringify(data, null, 2));
    
    return data;
}

/**
 * SEND MESSAGE
 * 
 * PURPOSE: Sends a user question to Genie within a conversation.
 * Genie will:
 * 1. Parse the natural language question
 * 2. Generate SQL to query your data
 * 3. Execute the SQL
 * 4. Return results
 * 
 * API ENDPOINT: POST /api/2.0/genie/spaces/{space_id}/conversations/{conversation_id}/messages
 * 
 * REQUEST BODY:
 * {
 *   "content": "Who has won the most races in F1 history?"
 * }
 * 
 * RESPONSE STRUCTURE:
 * {
 *   "id": "01ef-message-id",           // Message ID - use this to poll for results
 *   "conversation_id": "01ef-conv-id",
 *   "space_id": "01ef-space-id",
 *   "content": "Who has won...",       // Your original question
 *   "status": "EXECUTING",              // Status: EXECUTING -> COMPLETED or FAILED
 *   "created_timestamp": 1234567890,
 *   "attachments": []                   // Empty initially, filled when COMPLETED
 * }
 * 
 * WHY WE POLL: The message starts with status "EXECUTING" because Genie needs time to:
 * - Understand your question
 * - Generate appropriate SQL
 * - Run the query against your data
 * - Format the results
 * 
 * We must poll the message endpoint until status becomes "COMPLETED".
 */
async function sendMessage(workspaceUrl, token, spaceId, conversationId, content, context) {
    const url = `${workspaceUrl}/api/2.0/genie/spaces/${spaceId}/conversations/${conversationId}/messages`;
    
    context.log('=== Sending Message ===');
    context.log('URL:', url);
    context.log('Question:', content);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
    });

    if (!response.ok) {
        const errorText = await response.text();
        context.log.error('Failed to send message:', errorText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    context.log('Message sent successfully!');
    context.log('Message ID:', data.id);
    context.log('Initial status:', data.status);
    context.log('Full response:', JSON.stringify(data, null, 2));
    
    return data;
}

/**
 * POLL RESULT
 * 
 * PURPOSE: Checks if a message has completed processing and retrieves the results.
 * This must be called repeatedly until status is "COMPLETED" or "FAILED".
 * 
 * API ENDPOINT: GET /api/2.0/genie/spaces/{space_id}/conversations/{conversation_id}/messages/{message_id}
 * 
 * RESPONSE STRUCTURE (when EXECUTING):
 * {
 *   "id": "01ef-message-id",
 *   "status": "EXECUTING",
 *   "attachments": []
 * }
 * 
 * RESPONSE STRUCTURE (when COMPLETED):
 * {
 *   "id": "01ef-message-id",
 *   "status": "COMPLETED",
 *   "attachments": [
 *     {
 *       "query": {
 *         "query": "SELECT driver, COUNT(*) as wins FROM f1_races...",  // The generated SQL
 *         "status": "SUCCEEDED",
 *         "query_result": {
 *           "row_count": 25,
 *           "data_array": [                    // *** THIS IS THE ACTUAL DATA YOU WANT ***
 *             ["Lewis Hamilton", 103],
 *             ["Michael Schumacher", 91],
 *             ["Sebastian Vettel", 53],
 *             ...
 *           ],
 *           "schema": {
 *             "columns": [
 *               {"name": "driver", "type": "STRING"},
 *               {"name": "wins", "type": "LONG"}
 *             ]
 *           },
 *           "truncated": false
 *         }
 *       },
 *       "text": {
 *         "content": "Based on the query results..."  // Genie's natural language response
 *       }
 *     }
 *   ]
 * }
 * 
 * KEY FIELDS TO EXTRACT:
 * - attachments[0].query.query_result.data_array: The actual rows of data
 * - attachments[0].query.query_result.schema.columns: Column names and types
 * - attachments[0].text.content: Genie's explanation (optional to show)
 * 
 * WHY THIS MATTERS: The data_array contains the ACTUAL RESULTS your user wants to see.
 * This is what you'll parse and display as an HTML table in the frontend.
 */
async function pollResult(workspaceUrl, token, spaceId, conversationId, messageId, context) {
    const url = `${workspaceUrl}/api/2.0/genie/spaces/${spaceId}/conversations/${conversationId}/messages/${messageId}`;
    
    context.log('=== Polling for Result ===');
    context.log('URL:', url);
    context.log('Message ID:', messageId);
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        context.log.error('Failed to poll result:', errorText);
        throw new Error(`Failed to poll result: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    context.log('Poll response received');
    context.log('Status:', data.status);
    
    // Log the full structure so you can see what Genie returns
    if (data.status === 'COMPLETED') {
        context.log('=== MESSAGE COMPLETED ===');
        context.log('Full response structure:', JSON.stringify(data, null, 2));
        
        // Log the query result data specifically
        if (data.attachments && data.attachments.length > 0) {
            const attachment = data.attachments[0];
            if (attachment.query && attachment.query.query_result) {
                context.log('=== QUERY RESULT DATA ===');
                context.log('Row count:', attachment.query.query_result.row_count);
                context.log('Columns:', JSON.stringify(attachment.query.query_result.schema?.columns, null, 2));
                context.log('Data array (first 5 rows):', JSON.stringify(attachment.query.query_result.data_array?.slice(0, 5), null, 2));
                context.log('Generated SQL:', attachment.query.query);
            }
            
            if (attachment.text) {
                context.log('Genie explanation:', attachment.text.content);
            }
        }
    } else if (data.status === 'EXECUTING') {
        context.log('Message still executing... frontend should poll again');
    } else if (data.status === 'FAILED') {
        context.log.error('Message failed!');
        if (data.attachments && data.attachments.length > 0) {
            context.log.error('Error details:', JSON.stringify(data.attachments[0], null, 2));
        }
    }
    
    return data;
}

/**
 * Categorize errors to help frontend show appropriate messages
 */
function categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
        return 'auth';
    }
    if (message.includes('429') || message.includes('rate limit')) {
        return 'rate_limit';
    }
    if (message.includes('timeout')) {
        return 'timeout';
    }
    if (message.includes('network') || message.includes('fetch')) {
        return 'network';
    }
    
    return 'default';
}
