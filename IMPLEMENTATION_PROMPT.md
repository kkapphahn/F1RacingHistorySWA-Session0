# Databricks Genie Chat Integration - Implementation Prompt

## Context
You are implementing a Databricks Genie AI chat widget into an existing F1 Racing History website built with vanilla HTML/CSS/JavaScript and deployed on Azure Static Web Apps. The site currently has NO backend API - this will be your first Azure Functions implementation.

## What You're Building
An AI-powered chat interface that allows users to ask natural language questions about F1 racing data (e.g., "Who won the most championships?", "Show me fastest lap records"). The chat will use Databricks Genie API to query F1 datasets and return results as formatted data tables.

## Technical Architecture

### Frontend (Vanilla JavaScript)
- **Chat Button**: Fixed position bottom-right (60px circular, red-to-gold gradient)
- **Chat Panel**: 400px right-side drawer (desktop), full-screen modal (mobile)
- **Message Display**: User messages (red background, right-aligned), Genie responses (dark cards, left-aligned)
- **Input Area**: Textarea with character validation (5-1000 chars), send button, example query buttons
- **Data Tables**: HTML tables with F1 theme styling (gold headers, alternating rows)

### Backend (Azure Functions - Node.js 18)
- **Endpoint**: `/api/genie` POST handler
- **Operations**: 
  1. `start-conversation` - Initialize new Genie conversation
  2. `send-message` - Send user query to Genie
  3. `poll-result` - Poll for query completion with exponential backoff
- **Authentication**: Bearer token using Databricks PAT stored in environment variables
- **Error Handling**: Network errors, timeouts, rate limits, API failures

### Configuration
- **Environment Variables**: `DATABRICKS_HOST`, `DATABRICKS_TOKEN`, `DATABRICKS_SPACE_ID`
- **CSP Updates**: Add `connect-src 'self'` for API calls
- **GitHub Secrets**: Pass env vars through GitHub Actions to Azure SWA

## Design Requirements

### F1 Theme Color Palette
```css
--primary-red: #e10600    /* Buttons, user messages, accents */
--dark-bg: #15151e        /* Section backgrounds */
--darker-bg: #0a0a0f      /* Hero/footer */
--gold: #ffd700           /* Premium accents, highlights, headers */
--light-gray: #e0e0e0     /* Primary text */
--card-bg: #1e1e28        /* Genie message bubbles, table backgrounds */
```

### Typography
- **Display**: Orbitron (weights: 900, 700, 400) - Headers, titles
- **Body**: Rajdhani (weights: 700, 600, 400, 300) - All body text, messages

### Visual Effects
- Smooth transitions (0.3-0.6s ease)
- Box shadows for depth: `0 10px 30px rgba(0,0,0,0.5)`
- Hover effects: scale(1.05-1.1), shadow enhancements
- Slide-in animations for panel open/close
- Typing indicator: Three dots with staggered pulse animation

## Implementation Requirements

### 1. Azure Functions API (`/api/genie/`)

**File Structure:**
```
/api/
├── package.json          (node-fetch@2.6.7 dependency)
└── genie/
    ├── function.json     (HTTP POST trigger, anonymous auth)
    └── index.js          (Main handler logic)
```

**API Request Format:**
```javascript
POST /api/genie
{
  "action": "start-conversation" | "send-message" | "poll-result",
  "content": "user query text",           // for send-message
  "conversationId": "conv-id",            // for send-message, poll-result
  "messageId": "msg-id"                   // for poll-result
}
```

**API Response Format:**
```javascript
{
  "success": true | false,
  "data": { /* Databricks API response */ },
  "error": "error message if failed"
}
```

**Databricks API Endpoints:**
- Start: `POST https://{DATABRICKS_HOST}/api/2.0/genie/spaces/{SPACE_ID}/start-conversation`
- Send: `POST https://{DATABRICKS_HOST}/api/2.0/genie/spaces/{SPACE_ID}/conversations/{conversationId}/messages`
  - Body: `{"content": "user query"}`
- Poll: `GET https://{DATABRICKS_HOST}/api/2.0/genie/spaces/{SPACE_ID}/conversations/{conversationId}/messages/{messageId}`

**Polling Logic (Exponential Backoff):**
- Initial delay: 500ms
- Backoff: 500ms → 1000ms → 2000ms → 5000ms (max)
- Total timeout: 60 seconds
- Check `status` field: `EXECUTING` (continue), `COMPLETED` (return), `FAILED` (error)

**Error Handling:**
- 401/403: Authentication errors
- 429: Rate limit exceeded
- 500: Server errors
- Timeout: Query took too long
- Network errors: Connection failed

### 2. HTML Structure (`index.html`)

Add before closing `</body>` tag:

```html
<!-- Genie Chat Widget -->
<div id="genie-chat-widget">
  <!-- Chat Button -->
  <button class="genie-chat-btn" id="genie-chat-btn" aria-label="Open F1 Genie Chat">
    <span class="genie-icon">🤖</span>
  </button>

  <!-- Chat Panel -->
  <div class="genie-chat-panel" id="genie-chat-panel" role="dialog" aria-label="F1 Genie Chat">
    <!-- Header -->
    <div class="genie-chat-header">
      <h3>Ask Genie about F1</h3>
      <button class="genie-close-btn" id="genie-close-btn" aria-label="Close chat">&times;</button>
    </div>

    <!-- Messages Container -->
    <div class="genie-messages" id="genie-messages">
      <!-- Welcome Message -->
      <div class="genie-welcome">
        <p>Ask me anything about F1 history!</p>
        <div class="genie-examples">
          <button class="genie-example-btn" data-query="Who won the most championships?">
            Who won the most championships?
          </button>
          <button class="genie-example-btn" data-query="Show me fastest lap records">
            Show me fastest lap records
          </button>
          <button class="genie-example-btn" data-query="Tell me about the 1988 season">
            Tell me about the 1988 season
          </button>
        </div>
      </div>
    </div>

    <!-- Input Footer -->
    <div class="genie-input-container">
      <textarea 
        id="genie-input" 
        class="genie-input" 
        placeholder="Ask about F1 history..."
        rows="1"
        maxlength="1000"
        aria-label="Message input"></textarea>
      <button class="genie-send-btn" id="genie-send-btn" aria-label="Send message">
        <span>➤</span>
      </button>
    </div>
  </div>
</div>
```

### 3. CSS Styling (`styles.css`)

**Key Components to Style:**

```css
/* Chat Button - Fixed bottom-right */
.genie-chat-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-red) 0%, var(--gold) 100%);
  box-shadow: 0 8px 25px rgba(225, 6, 0, 0.5);
  z-index: 999;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.genie-chat-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 35px rgba(225, 6, 0, 0.7);
}

/* Chat Panel - Sliding drawer (desktop) */
.genie-chat-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: var(--darker-bg);
  box-shadow: -5px 0 30px rgba(0, 0, 0, 0.5);
  transform: translateX(450px);
  transition: transform 0.4s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.genie-chat-panel.open {
  transform: translateX(0);
}

/* Mobile: Full-screen modal */
@media (max-width: 768px) {
  .genie-chat-panel {
    width: 100%;
    transform: translateY(100%);
  }
  .genie-chat-panel.open {
    transform: translateY(0);
  }
}

/* Message Bubbles */
.genie-message.user {
  align-self: flex-end;
  background: var(--primary-red);
  color: white;
  border-radius: 12px 12px 2px 12px;
}

.genie-message.assistant {
  align-self: flex-start;
  background: var(--card-bg);
  color: var(--light-gray);
  border-radius: 12px 12px 12px 2px;
}

/* Data Table Styling */
.genie-results-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Rajdhani', sans-serif;
  margin-top: 10px;
}

.genie-results-table thead {
  background: var(--gold);
  color: var(--darker-bg);
  font-weight: 700;
}

.genie-results-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.05);
}

/* Typing Indicator Animation */
.genie-typing {
  display: flex;
  gap: 4px;
}

.genie-typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gold);
  animation: typing-pulse 1.4s infinite;
}

.genie-typing span:nth-child(2) { animation-delay: 0.2s; }
.genie-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-pulse {
  0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
  30% { transform: scale(1.3); opacity: 1; }
}
```

### 4. JavaScript Logic (`script.js`)

**GenieChat Class Structure:**

```javascript
class GenieChat {
  constructor() {
    this.conversationId = null;
    this.messages = [];
    this.isOpen = false;
    this.isLoading = false;
    this.elements = {
      button: document.getElementById('genie-chat-btn'),
      panel: document.getElementById('genie-chat-panel'),
      closeBtn: document.getElementById('genie-close-btn'),
      messages: document.getElementById('genie-messages'),
      input: document.getElementById('genie-input'),
      sendBtn: document.getElementById('genie-send-btn')
    };
    this.init();
  }

  init() {
    // Load state from localStorage
    // Attach event listeners
    // Restore conversation if exists
  }

  toggle() {
    // Open/close panel
    // Focus input when opening
  }

  async sendMessage(content) {
    // Validate input (5-1000 chars)
    // Sanitize content
    // Add user message to UI immediately
    // Start conversation if needed
    // Send message to API
    // Show typing indicator
    // Poll for results
  }

  async startConversation() {
    // POST /api/genie with action: 'start-conversation'
    // Save conversationId
  }

  async sendMessageToAPI(content) {
    // POST /api/genie with action: 'send-message'
    // Return messageId
  }

  async pollForResult(messageId) {
    // Exponential backoff polling
    // 500ms → 1s → 2s → 5s intervals
    // 60s total timeout
    // Parse and render result
  }

  renderMessage(role, content, timestamp) {
    // Create message bubble
    // Add to messages container
    // Auto-scroll to bottom
  }

  renderDataTable(queryResult) {
    // Extract schema.columns and data_array
    // Generate HTML table
    // Apply F1 styling
  }

  saveState() {
    // Save to localStorage: conversationId, messages
  }

  loadState() {
    // Load from localStorage
    // Restore UI
  }

  showError(message, canRetry) {
    // Display error message with retry button
  }

  showTypingIndicator() {
    // Add animated "..." bubble
  }

  hideTypingIndicator() {
    // Remove typing bubble
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new GenieChat();
});
```

**Key Functions to Implement:**

1. **Input Validation:**
   - Min 5 characters
   - Max 1000 characters
   - Trim whitespace
   - Block empty messages
   - Sanitize HTML (use textContent)

2. **Exponential Backoff Polling:**
```javascript
async pollForResult(messageId, attempt = 0) {
  const delays = [500, 1000, 2000, 5000]; // ms
  const maxAttempts = 30; // ~60 seconds total
  
  if (attempt >= maxAttempts) {
    throw new Error('Query timeout - Genie took too long');
  }
  
  const delay = delays[Math.min(attempt, delays.length - 1)];
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const response = await fetch('/api/genie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'poll-result',
      conversationId: this.conversationId,
      messageId
    })
  });
  
  const result = await response.json();
  
  if (result.data.status === 'EXECUTING') {
    return this.pollForResult(messageId, attempt + 1);
  }
  
  return result;
}
```

3. **Error Handling:**
```javascript
handleError(error, lastQuery) {
  const errorMessages = {
    'timeout': 'Genie is thinking too long, try again',
    'network': 'Could not connect to Genie',
    'rate_limit': 'Too many requests, wait a moment',
    'auth': 'Authentication failed',
    'default': 'Something went wrong, please retry'
  };
  
  const message = errorMessages[error.type] || errorMessages.default;
  this.showError(message, lastQuery);
}
```

4. **Data Table Rendering:**
```javascript
renderDataTable(queryResult) {
  const { data_array, schema } = queryResult;
  
  if (!data_array || data_array.length === 0) {
    return '<p class="genie-no-results">No data found</p>';
  }
  
  let html = '<div class="genie-table-wrapper"><table class="genie-results-table">';
  
  // Header
  html += '<thead><tr>';
  schema.columns.forEach(col => {
    html += `<th>${this.escapeHtml(col.name)}</th>`;
  });
  html += '</tr></thead>';
  
  // Body
  html += '<tbody>';
  data_array.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      html += `<td>${this.escapeHtml(String(cell))}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  
  return html;
}
```

### 5. Configuration Updates

**`staticwebapp.config.json`:**
```json
{
  "platform": {
    "apiRuntime": "node:18"
  },
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,ico}", "/css/*", "/js/*", "/api/*"]
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; img-src 'self' data:;",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".css": "text/css",
    ".js": "application/javascript",
    ".html": "text/html"
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html"
    }
  }
}
```

**GitHub Actions Workflow (`.github/workflows/azure-static-web-apps-*.yml`):**

Add to deployment step:
```yaml
env:
  DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
  DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_TOKEN }}
  DATABRICKS_SPACE_ID: ${{ secrets.DATABRICKS_SPACE_ID }}
```

### 6. Testing Checklist

**Before Deployment:**
- [ ] Azure Functions run locally with `func start`
- [ ] Can start conversation and get conversationId
- [ ] Can send message and get messageId
- [ ] Polling completes successfully with data
- [ ] Error handling works (invalid input, timeout, network failure)

**After Deployment:**
- [ ] Chat button appears bottom-right
- [ ] Panel opens/closes smoothly
- [ ] Welcome message displays with example buttons
- [ ] Example buttons send queries
- [ ] User messages appear immediately
- [ ] Typing indicator shows while polling
- [ ] Data tables render correctly with F1 styling
- [ ] localStorage persists conversation
- [ ] Mobile view is full-screen and usable
- [ ] Error messages show with retry buttons
- [ ] Refresh page restores conversation

## Environment Setup

### Required GitHub Secrets
1. **DATABRICKS_HOST**: Your workspace URL (e.g., `adb-1234567890123456.7.azuredatabricks.net`)
2. **DATABRICKS_TOKEN**: Personal Access Token from Databricks
3. **DATABRICKS_SPACE_ID**: Genie Space ID (e.g., `01ef-xxxx-xxxx`)

### How to Get These Values

**DATABRICKS_HOST:**
- Open your Databricks workspace
- Copy the URL hostname (without `https://`)

**DATABRICKS_TOKEN:**
1. Databricks UI → User Settings (top-right dropdown)
2. Developer → Access Tokens
3. Generate New Token
4. Set expiration, add comment
5. Copy token (shown once only!)

**DATABRICKS_SPACE_ID:**
1. Databricks UI → Genie
2. Open or create a Genie Space
3. Space ID is in the URL: `.../genie/spaces/{SPACE_ID}/...`
4. Or call API: `GET /api/2.0/genie/spaces` and find your space

## Implementation Order

1. **Create API backend** (`/api` folder, `package.json`, `function.json`, `index.js`)
2. **Test API locally** (use Azure Functions Core Tools, Postman/curl)
3. **Add HTML structure** (chat button, panel, messages, input)
4. **Add CSS styling** (match F1 theme, responsive design)
5. **Implement JavaScript** (GenieChat class, event handlers, API calls)
6. **Update configuration** (`staticwebapp.config.json`, GitHub secrets)
7. **Deploy and test** (push to master, verify in production)
8. **Polish UX** (animations, loading states, error handling)

## Common Pitfalls to Avoid

1. **NEVER expose Databricks token in frontend code**
2. **Always sanitize user input and API responses** (prevent XSS)
3. **Handle polling timeout gracefully** (don't infinite loop)
4. **Test mobile layout** (full-screen modal, keyboard handling)
5. **Validate environment variables exist** (fail gracefully if missing)
6. **Log errors in Azure Functions** (helps debugging in production)
7. **Check CSP headers** (ensure `connect-src 'self'` allows API calls)
8. **Test localStorage edge cases** (private browsing, quota exceeded)
9. **Handle Genie API rate limits** (429 responses)
10. **Remember Azure Functions cold start** (first request may be slow)

## Success Criteria

✅ User clicks chat button → panel slides open smoothly  
✅ User sees welcome message with 3 clickable example queries  
✅ User types question → input validates (5-1000 chars)  
✅ User sends message → appears immediately in red bubble  
✅ Typing indicator shows while Genie processes  
✅ Results appear in formatted table with gold headers  
✅ User refreshes page → conversation persists from localStorage  
✅ User closes chat → can reopen and continue conversation  
✅ Errors show friendly messages with retry buttons  
✅ Mobile users get full-screen modal experience  
✅ F1 theme colors (red/black/gold) used throughout  
✅ No Databricks credentials visible in browser/network tools  

## Additional Resources

- **Databricks Genie API Docs**: https://docs.databricks.com/api/workspace/genie
- **Azure Static Web Apps Docs**: https://learn.microsoft.com/azure/static-web-apps/
- **Azure Functions Node.js Docs**: https://learn.microsoft.com/azure/azure-functions/functions-reference-node

---

**Ready to implement? Start with Step 1: Create the `/api` folder structure and test the Databricks connection locally before adding any frontend code.**
