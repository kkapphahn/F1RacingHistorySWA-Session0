# Genie API Testing Guide

This directory contains tools for testing the Databricks Genie API integration locally before deploying.

## Prerequisites

1. **Install Azure Functions Core Tools**
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. **Install Node.js dependencies**
   ```bash
   cd api
   npm install
   ```

3. **Configure local settings**
   - Copy `local.settings.json.example` to `local.settings.json`
   - Fill in your actual Databricks credentials:
     ```json
     {
       "Values": {
         "DATABRICKS_WORKSPACE_URL": "https://adb-xxx.azuredatabricks.net",
         "DATABRICKS_PAT_TOKEN": "dapi1234567890abcdef...",
         "GENIE_SPACE_ID": "01ef-xxxx-xxxx-xxxx"
       }
     }
     ```

## Running Tests

### Step 1: Start Azure Functions Locally

```bash
cd api
func start
```

You should see:
```
Azure Functions Core Tools
...
Functions:
  genie: [GET,POST] http://localhost:7071/api/genie
```

### Step 2: Run the Test Suite

In a **separate terminal**:

```bash
cd api
node test-genie-local.js
```

## What the Tests Do

The test suite validates the complete Genie workflow:

1. **Health Check** - Verifies the API is running
2. **Start Conversation** - Creates a new Genie conversation
3. **Send Message** - Sends test query: "Show me the top 5 drivers"
4. **Poll for Result** - Uses exponential backoff to wait for completion
5. **Validate Data** - Checks result structure and displays sample data

## Expected Output

```
🧪 DATABRICKS GENIE API - LOCAL TEST SUITE
Query: "Show me the top 5 drivers"

============================================================
TEST 1: Health Check (GET /api/genie)
============================================================
✅ Health check passed
ℹ️  Message: Genie API is running
ℹ️  Timestamp: 2025-12-05T...

============================================================
TEST 2: Start Conversation
============================================================
ℹ️  Calling start-conversation...
✅ Conversation started successfully
ℹ️  Conversation ID: 01ef-xxx-xxx
ℹ️  Space ID: 01ef-xxx
ℹ️  Created: 12/5/2025, 3:45:30 PM

============================================================
TEST 3: Send Message
============================================================
ℹ️  Query: "Show me the top 5 drivers"
ℹ️  Sending message...
✅ Message sent successfully
ℹ️  Message ID: 01ef-xxx-xxx
ℹ️  Status: EXECUTING

============================================================
TEST 4: Poll for Result
============================================================
ℹ️  Poll attempt 1/30 (waiting 500ms)...
Status: FILTERING_CONTEXT
ℹ️  Poll attempt 2/30 (waiting 1000ms)...
Status: EXECUTING
ℹ️  Poll attempt 3/30 (waiting 2000ms)...
Status: COMPLETED
✅ Query completed!

============================================================
TEST 5: Validate Result Data Structure
============================================================
✅ Found 1 attachment(s)
✅ Query result found
ℹ️  Row count: 5
ℹ️  Columns: 2
ℹ️  Truncated: false

📋 Column Schema:
  1. driver_name (STRING)
  2. total_wins (LONG)

📊 Sample Data (first 3 rows):
  Row 1: [ 'Lewis Hamilton', 103 ]
  Row 2: [ 'Michael Schumacher', 91 ]
  Row 3: [ 'Sebastian Vettel', 53 ]

🔍 Generated SQL:
SELECT driver_name, COUNT(*) as total_wins 
FROM f1_races 
WHERE position = 1 
GROUP BY driver_name 
ORDER BY total_wins DESC 
LIMIT 5

============================================================
TEST SUMMARY
============================================================
✅ All tests passed in 8.45 seconds! 🎉
ℹ️  Your Genie integration is working correctly
```

## Troubleshooting

### Error: "ECONNREFUSED"
- Make sure Azure Functions is running: `func start`
- Check that it's listening on port 7071

### Error: "Missing required environment variables"
- Verify `local.settings.json` exists and has correct values
- Check that file is in the `api/` directory

### Error: "Failed to start conversation: 401"
- Your Databricks PAT token is invalid or expired
- Generate a new token in Databricks User Settings

### Error: "Failed to start conversation: 404"
- Your Genie Space ID is incorrect
- Check the Space ID in your Databricks Genie UI

### Error: "Timeout: Query took too long"
- Your Genie Space might not have data
- Try a simpler query
- Check Databricks logs for SQL errors

## Testing Custom Queries

Edit `test-genie-local.js` line 12:

```javascript
const TEST_QUERY = 'Your custom question here';
```

Then re-run: `node test-genie-local.js`

## Debugging Tips

1. **Check Function Logs**
   - The Azure Functions terminal shows detailed logs
   - Look for request/response data structures

2. **Inspect Result Structure**
   - If validation fails, the test prints the full result JSON
   - Use this to understand what Genie returns

3. **Test Different Queries**
   - Try simple queries first: "Show me 10 rows"
   - Then test complex ones: "Who won the most races in 2023?"

## Next Steps

Once local tests pass:
1. Commit changes: `git add . && git commit -m "Add local tests"`
2. Push to deploy: `git push origin master`
3. Test on live site after deployment completes

## Files

- `test-genie-local.js` - Main test suite
- `local.settings.json` - Your local credentials (gitignored)
- `local.settings.json.example` - Template for credentials
