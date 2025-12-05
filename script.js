// ================================
// SMOOTH SCROLLING FOR NAVIGATION
// ================================

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetSection.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Also handle CTA button smooth scroll
document.querySelector('.cta-button')?.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    
    if (targetSection) {
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = targetSection.offsetTop - navbarHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
});

// ================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ================================

const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optional: stop observing after animation
            fadeInObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all elements with fade-in class
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(element => {
        fadeInObserver.observe(element);
    });
});

// ================================
// PARALLAX EFFECT ON HERO SECTION
// ================================

let lastScrollY = 0;
let ticking = false;

function updateParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const scrolled = window.pageYOffset;
    const heroHeight = hero.offsetHeight;
    
    // Only apply parallax when hero is visible
    if (scrolled < heroHeight) {
        const parallaxSpeed = 0.5;
        hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        
        // Fade out hero content on scroll
        const heroContent = document.querySelector('.hero-content');
        const opacity = 1 - (scrolled / heroHeight) * 1.5;
        heroContent.style.opacity = Math.max(0, opacity);
    }
    
    ticking = false;
}

function requestParallaxUpdate() {
    if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
    }
}

window.addEventListener('scroll', requestParallaxUpdate);

// ================================
// NAVBAR BACKGROUND ON SCROLL
// ================================

let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add extra background opacity when scrolled
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 10, 15, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    } else {
        navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ================================
// TIMELINE SEQUENTIAL ANIMATION
// ================================

const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Get index of timeline item
            const timelineItems = document.querySelectorAll('.timeline-item');
            const index = Array.from(timelineItems).indexOf(entry.target);
            
            // Add staggered delay based on index
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 150); // 150ms delay between each item
            
            timelineObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
});

document.addEventListener('DOMContentLoaded', () => {
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });
});

// ================================
// CHAMPION CARDS STAGGERED ANIMATION
// ================================

const championObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const championCards = document.querySelectorAll('.champion-card');
            const index = Array.from(championCards).indexOf(entry.target);
            
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
            
            championObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});

document.addEventListener('DOMContentLoaded', () => {
    const championCards = document.querySelectorAll('.champion-card');
    championCards.forEach(card => {
        championObserver.observe(card);
    });
});

// ================================
// MOMENT CARDS STAGGERED ANIMATION
// ================================

const momentObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const momentCards = document.querySelectorAll('.moment-card');
            const index = Array.from(momentCards).indexOf(entry.target);
            
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
            
            momentObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});

document.addEventListener('DOMContentLoaded', () => {
    const momentCards = document.querySelectorAll('.moment-card');
    momentCards.forEach(card => {
        momentObserver.observe(card);
    });
});

// ================================
// ACTIVE NAV LINK HIGHLIGHTING
// ================================

function setActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbarHeight = document.querySelector('.navbar').offsetHeight;
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - navbarHeight - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', setActiveNavLink);

// ================================
// PREVENT SCROLL JANK ON PAGE LOAD
// ================================

window.addEventListener('load', () => {
    document.body.style.overflow = 'visible';
    
    // Trigger initial checks
    setActiveNavLink();
    updateParallax();
});

// ================================
// HOVER EFFECTS ENHANCEMENT
// ================================

// Add dynamic hover effects to champion cards
document.querySelectorAll('.champion-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
});

// Add dynamic hover effects to moment cards
document.querySelectorAll('.moment-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        const icon = this.querySelector('.moment-icon');
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(5deg)';
            icon.style.transition = 'transform 0.3s ease';
        }
    });
    
    card.addEventListener('mouseleave', function() {
        const icon = this.querySelector('.moment-icon');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// ================================
// PERFORMANCE OPTIMIZATION
// ================================

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to resize events
const handleResize = debounce(() => {
    // Recalculate positions if needed
    setActiveNavLink();
}, 250);

window.addEventListener('resize', handleResize);

// ================================
// CONSOLE EASTER EGG
// ================================

console.log('%c🏎️ F1 Racing History', 'color: #e10600; font-size: 24px; font-weight: bold; font-family: Orbitron, sans-serif;');
console.log('%cWelcome to the ultimate F1 history experience!', 'color: #ffd700; font-size: 14px; font-family: Rajdhani, sans-serif;');
console.log('%cBuilt with passion for Formula 1 racing 🏁', 'color: #e0e0e0; font-size: 12px;');

// ================================
// GENIE CHAT WIDGET
// ================================

/**
 * GenieChat Class
 * 
 * Manages the Databricks Genie AI chat widget.
 * Handles conversation state, message sending, polling, and result rendering.
 * 
 * KEY CONCEPTS:
 * - Conversation: A thread that maintains context across multiple questions
 * - Message: A user question sent to Genie
 * - Polling: Checking repeatedly until Genie finishes processing
 * - Result Data: The actual rows and columns returned from the query
 */
class GenieChat {
    constructor() {
        // Conversation state
        this.conversationId = null;
        this.messages = [];
        this.isOpen = false;
        this.isLoading = false;
        this.lastQuery = null;
        
        // DOM elements
        this.elements = {
            button: document.getElementById('genie-chat-btn'),
            panel: document.getElementById('genie-chat-panel'),
            closeBtn: document.getElementById('genie-close-btn'),
            messages: document.getElementById('genie-messages'),
            input: document.getElementById('genie-input'),
            sendBtn: document.getElementById('genie-send-btn')
        };
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the chat widget
     * - Load saved state from localStorage
     * - Attach event listeners
     * - Restore previous conversation if exists
     */
    init() {
        console.log('🤖 Initializing Genie Chat Widget...');
        
        // Load state from localStorage
        this.loadState();
        
        // Attach event listeners
        this.elements.button.addEventListener('click', () => this.toggle());
        this.elements.closeBtn.addEventListener('click', () => this.toggle());
        this.elements.sendBtn.addEventListener('click', () => this.handleSend());
        
        // Handle Enter key (Shift+Enter for new line)
        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        
        // Enable/disable send button based on input
        this.elements.input.addEventListener('input', () => {
            const text = this.elements.input.value.trim();
            this.elements.sendBtn.disabled = text.length < 5 || this.isLoading;
        });
        
        // Example button clicks
        const exampleBtns = document.querySelectorAll('.genie-example-btn');
        exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.getAttribute('data-query');
                this.elements.input.value = query;
                this.handleSend();
            });
        });
        
        console.log('✅ Genie Chat initialized');
        if (this.conversationId) {
            console.log('📝 Restored conversation:', this.conversationId);
        }
    }
    
    /**
     * Toggle chat panel open/closed
     */
    toggle() {
        this.isOpen = !this.isOpen;
        this.elements.panel.classList.toggle('open', this.isOpen);
        
        if (this.isOpen) {
            this.elements.input.focus();
            this.scrollToBottom();
        }
    }
    
    /**
     * Handle send button click
     * Validates input and sends message to Genie
     */
    async handleSend() {
        const text = this.elements.input.value.trim();
        
        // Validate input
        if (text.length < 5) {
            alert('Please enter at least 5 characters');
            return;
        }
        
        if (text.length > 1000) {
            alert('Message is too long (max 1000 characters)');
            return;
        }
        
        if (this.isLoading) {
            return; // Already processing
        }
        
        // Clear input and disable send button
        this.elements.input.value = '';
        this.elements.sendBtn.disabled = true;
        this.lastQuery = text;
        
        // Send message
        await this.sendMessage(text);
    }
    
    /**
     * MAIN WORKFLOW: Send a message to Genie
     * 
     * Steps:
     * 1. Display user message immediately
     * 2. Start conversation if this is the first message
     * 3. Send message to Genie API
     * 4. Show typing indicator
     * 5. Poll until message is completed
     * 6. Display results
     */
    async sendMessage(content) {
        console.log('📤 Sending message to Genie:', content);
        
        try {
            this.isLoading = true;
            this.elements.button.classList.add('processing');
            
            // 1. Display user message immediately
            this.addMessage('user', content);
            this.scrollToBottom();
            
            // 2. Start conversation if needed
            if (!this.conversationId) {
                console.log('🆕 Starting new conversation...');
                const conversationData = await this.callAPI('start-conversation');
                this.conversationId = conversationData.conversation_id;
                console.log('✅ Conversation started:', this.conversationId);
                this.saveState();
            }
            
            // 3. Send message to Genie
            console.log('💬 Sending message to conversation:', this.conversationId);
            const messageData = await this.callAPI('send-message', {
                conversationId: this.conversationId,
                content: content
            });
            
            const messageId = messageData.id;
            console.log('✅ Message sent, ID:', messageId);
            console.log('📊 Initial status:', messageData.status);
            
            // 4. Show typing indicator
            this.showTypingIndicator();
            
            // 5. Poll for results (with exponential backoff)
            console.log('⏳ Polling for results...');
            const result = await this.pollForResult(messageId);
            
            // 6. Display results
            this.hideTypingIndicator();
            this.displayResult(result);
            
        } catch (error) {
            console.error('❌ Error sending message:', error);
            this.hideTypingIndicator();
            this.showError(error.message, true);
        } finally {
            this.isLoading = false;
            this.elements.button.classList.remove('processing');
        }
    }
    
    /**
     * Poll for message result with EXPONENTIAL BACKOFF
     * 
     * WHY EXPONENTIAL BACKOFF:
     * - Genie takes time to generate and execute SQL (typically 2-10 seconds)
     * - We don't want to spam the API with requests every 100ms
     * - Start with short delays (500ms), gradually increase to longer delays (5s)
     * - This balances responsiveness with API efficiency
     * 
     * POLLING SEQUENCE:
     * - Attempt 1: Wait 500ms
     * - Attempt 2: Wait 1000ms
     * - Attempt 3: Wait 2000ms
     * - Attempt 4+: Wait 5000ms (max)
     * - Timeout after 60 seconds total
     */
    async pollForResult(messageId, attempt = 0) {
        const delays = [500, 1000, 2000, 5000]; // Milliseconds
        const maxAttempts = 30; // ~60 seconds total
        
        if (attempt >= maxAttempts) {
            throw new Error('Query timeout - Genie took too long to respond. This might be a complex query.');
        }
        
        // Calculate delay for this attempt (exponential backoff)
        const delay = delays[Math.min(attempt, delays.length - 1)];
        console.log(`⏱️  Poll attempt ${attempt + 1}, waiting ${delay}ms...`);
        
        // Wait before polling
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Poll the API
        const result = await this.callAPI('poll-result', {
            conversationId: this.conversationId,
            messageId: messageId
        });
        
        console.log(`📊 Poll result - Status: ${result.status}`);
        
        // Check status
        // FILTERING_CONTEXT, EXECUTING, QUERY_RESULT_EXPIRED are intermediate states
        if (result.status === 'EXECUTING' || result.status === 'FILTERING_CONTEXT' || result.status === 'QUERY_RESULT_EXPIRED') {
            // Still processing, poll again
            console.log(`⏳ Status: ${result.status} - continuing to poll...`);
            return this.pollForResult(messageId, attempt + 1);
        } else if (result.status === 'COMPLETED') {
            console.log('✅ Message completed!');
            console.log('📦 Full result data:', result);
            return result;
        } else if (result.status === 'FAILED') {
            console.error('❌ Message failed:', result);
            
            // Extract detailed error information
            let errorMessage = 'Query failed';
            if (result.error) {
                if (typeof result.error === 'object' && result.error.error) {
                    errorMessage = result.error.error;
                } else if (typeof result.error === 'string') {
                    errorMessage = result.error;
                } else {
                    errorMessage = JSON.stringify(result.error);
                }
            }
            
            // Check for attachments with error details
            if (result.attachments && result.attachments.length > 0) {
                console.error('📋 Error attachments:', result.attachments);
                // Try to extract text content from attachments
                for (const attachment of result.attachments) {
                    if (attachment.text && attachment.text.content) {
                        console.error('💬 Genie explanation:', attachment.text.content);
                    }
                }
            }
            
            throw new Error(errorMessage);
        } else {
            // Unknown status - log it but try to continue polling
            console.warn('⚠️  Unknown status:', result.status, '- will try polling again');
            return this.pollForResult(messageId, attempt + 1);
        }
    }
    
    /**
     * Display the result from Genie
     * 
     * GENIE RESPONSE STRUCTURE:
     * The completed message contains "attachments" which include:
     * - query: The generated SQL and execution results
     * - text: Genie's natural language explanation
     * 
     * We extract the actual data from: attachments[0].query.query_result
     * This contains:
     * - data_array: The actual rows [[val1, val2], [val3, val4], ...]
     * - schema.columns: Column names and types
     * - row_count: Number of rows returned
     */
    displayResult(result) {
        console.log('🎨 Displaying result...');
        console.log('📦 Full result object:', result);
        
        // Check if we have attachments
        if (!result.attachments || result.attachments.length === 0) {
            this.addMessage('assistant', 'Genie processed your query but returned no data.');
            return;
        }
        
        console.log('📎 Number of attachments:', result.attachments.length);
        
        // Log all attachments to understand structure
        result.attachments.forEach((att, i) => {
            console.log(`📎 Attachment ${i}:`, att);
        });
        
        const attachment = result.attachments[0];
        let hasData = false;
        
        // Extract query result data
        if (attachment.query && attachment.query.query_result) {
            const queryResult = attachment.query.query_result;
            console.log('📊 Query result object:', queryResult);
            console.log('📏 Row count:', queryResult.row_count);
            console.log('📋 Schema:', queryResult.schema);
            console.log('📦 Data array:', queryResult.data_array);
            console.log('📦 Data array length:', queryResult.data_array?.length);
            
            // Check if we have actual data
            if (queryResult.data_array && queryResult.data_array.length > 0) {
                console.log('✅ Found data! First 3 rows:', queryResult.data_array.slice(0, 3));
                const tableHTML = this.renderDataTable(queryResult);
                this.addMessage('assistant', tableHTML);
                hasData = true;
            } else {
                console.warn('⚠️  No data in data_array');
            }
        } else {
            console.warn('⚠️  No query.query_result found in attachment');
        }
        
        // Show Genie's explanation if available
        if (attachment.text && attachment.text.content) {
            console.log('💬 Genie explanation:', attachment.text.content);
            this.addMessage('assistant', attachment.text.content);
        }
        
        // Show the generated SQL
        if (attachment.query && attachment.query.query) {
            console.log('🔍 Generated SQL:', attachment.query.query);
            const sqlHTML = `<div class="genie-sql-code"><pre>${this.escapeHtml(attachment.query.query)}</pre></div>`;
            this.addMessage('assistant', sqlHTML);
        }
        
        // If no data was shown, give user feedback
        if (!hasData) {
            console.warn('⚠️  No data rendered. Check console logs for response structure.');
            this.addMessage('assistant', 'Query executed but no data was returned. Check browser console for details.');
        }
        
        this.scrollToBottom();
    }
    
    /**
     * Render query result as HTML table
     * 
     * INPUT FORMAT (from Genie):
     * {
     *   "data_array": [
     *     ["Lewis Hamilton", 103],
     *     ["Michael Schumacher", 91],
     *     ["Sebastian Vettel", 53]
     *   ],
     *   "schema": {
     *     "columns": [
     *       {"name": "driver", "type": "STRING"},
     *       {"name": "wins", "type": "LONG"}
     *     ]
     *   },
     *   "row_count": 25,
     *   "truncated": false
     * }
     * 
     * OUTPUT: HTML table with F1 styling
     */
    renderDataTable(queryResult) {
        const { data_array, schema, row_count } = queryResult;
        
        // Handle empty results
        if (!data_array || data_array.length === 0) {
            return '<p style="color: var(--medium-gray); font-style: italic;">No data found for this query.</p>';
        }
        
        console.log('🎨 Rendering table with', data_array.length, 'rows and', schema.columns.length, 'columns');
        
        let html = '<div class="genie-table-wrapper"><table class="genie-results-table">';
        
        // Table Header
        html += '<thead><tr>';
        schema.columns.forEach(col => {
            html += `<th>${this.escapeHtml(col.name)}</th>`;
        });
        html += '</tr></thead>';
        
        // Table Body
        html += '<tbody>';
        data_array.forEach((row, rowIndex) => {
            html += '<tr>';
            row.forEach((cell, colIndex) => {
                const colType = schema.columns[colIndex].type;
                const isNumeric = ['LONG', 'INT', 'DOUBLE', 'FLOAT', 'DECIMAL'].includes(colType);
                const className = isNumeric ? 'numeric' : '';
                const displayValue = cell === null ? 'NULL' : String(cell);
                html += `<td class="${className}">${this.escapeHtml(displayValue)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        
        html += '</table></div>';
        
        // Show row count if truncated
        if (queryResult.truncated) {
            html += `<p style="color: var(--gold); font-size: 0.85rem; margin-top: 5px;">Showing first ${data_array.length} of ${row_count} rows</p>`;
        }
        
        return html;
    }
    
    /**
     * Call the Azure Function API
     * This is the secure proxy that talks to Databricks
     */
    async callAPI(action, params = {}) {
        console.log(`🌐 API Call: ${action}`, params);
        
        try {
            const response = await fetch('/api/genie', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action,
                    ...params
                })
            });
            
            // Check if response is OK
            if (!response.ok) {
                console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                
                // Try to get error details
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                } else {
                    // Response is HTML or plain text (like Azure's 503 page)
                    const text = await response.text();
                    console.error('Non-JSON response:', text.substring(0, 200));
                    
                    if (response.status === 503) {
                        throw new Error('Service temporarily unavailable. The function may be starting up or experiencing high load. Please try again in a moment.');
                    } else if (response.status === 500) {
                        throw new Error('Server error. Check the Azure Function logs for details.');
                    } else {
                        throw new Error(`Server error: ${response.status}`);
                    }
                }
            }
            
            // Parse JSON response
            const result = await response.json();
            console.log(`📥 API Response (${action}):`, result);
            
            if (!result.success) {
                throw new Error(result.error || 'API request failed');
            }
            
            return result.data;
            
        } catch (error) {
            // Re-throw with more context
            if (error.message.includes('JSON')) {
                throw new Error('Invalid response from server. The API may be misconfigured or experiencing issues.');
            }
            throw error;
        }
    }
    
    /**
     * Add a message to the chat UI
     */
    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `genie-message ${role}`;
        
        // If content contains HTML (like tables), insert it directly
        if (content.includes('<')) {
            messageDiv.innerHTML = content;
        } else {
            messageDiv.textContent = content;
        }
        
        // Add timestamp
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeSpan = document.createElement('span');
        timeSpan.className = 'genie-message-time';
        timeSpan.textContent = time;
        messageDiv.appendChild(timeSpan);
        
        // Remove welcome message if this is the first real message
        const welcome = document.querySelector('.genie-welcome');
        if (welcome && role === 'user') {
            welcome.remove();
        }
        
        this.elements.messages.appendChild(messageDiv);
        
        // Store in messages array
        this.messages.push({ role, content, timestamp: Date.now() });
        this.saveState();
    }
    
    /**
     * Show typing indicator (animated dots)
     */
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'genie-typing';
        indicator.id = 'genie-typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        this.elements.messages.appendChild(indicator);
        this.scrollToBottom();
    }
    
    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('genie-typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    /**
     * Show error message with retry button
     */
    showError(message, canRetry = true) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'genie-error';
        
        // User-friendly error messages
        let displayMessage = message;
        if (message.includes('401') || message.includes('403')) {
            displayMessage = 'Authentication failed. Please check your Databricks credentials.';
        } else if (message.includes('429')) {
            displayMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (message.includes('timeout')) {
            displayMessage = 'Query took too long to complete. Try a simpler question.';
        } else if (message.includes('fetch') || message.includes('network')) {
            displayMessage = 'Could not connect to Genie. Check your internet connection.';
        } else if (message.includes('Azure storage') || message.includes('not authorized')) {
            displayMessage = 'Data access error: The Genie Space may not have proper access to your data tables. Check your Databricks workspace permissions and storage configuration.';
        } else if (message.includes('SQL_EXECUTION_EXCEPTION')) {
            displayMessage = 'SQL execution error: The query failed to run. This may be due to data access permissions or missing tables in your workspace.';
        }
        
        errorDiv.innerHTML = `
            <p><strong>Error:</strong> ${this.escapeHtml(displayMessage)}</p>
            ${canRetry ? `<button class="genie-retry-btn">Retry</button>` : ''}
        `;
        
        if (canRetry) {
            errorDiv.querySelector('.genie-retry-btn').addEventListener('click', () => {
                errorDiv.remove();
                if (this.lastQuery) {
                    this.sendMessage(this.lastQuery);
                }
            });
        }
        
        this.elements.messages.appendChild(errorDiv);
        this.scrollToBottom();
    }
    
    /**
     * Scroll messages container to bottom
     */
    scrollToBottom() {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
    
    /**
     * Save conversation state to localStorage
     */
    saveState() {
        const state = {
            conversationId: this.conversationId,
            messages: this.messages.slice(-20) // Keep last 20 messages
        };
        localStorage.setItem('GENIE_CHAT_STATE', JSON.stringify(state));
        console.log('💾 State saved to localStorage');
    }
    
    /**
     * Load conversation state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('GENIE_CHAT_STATE');
            if (saved) {
                const state = JSON.parse(saved);
                this.conversationId = state.conversationId;
                this.messages = state.messages || [];
                
                // Restore messages to UI (but keep welcome message if no messages)
                if (this.messages.length > 0) {
                    const welcome = document.querySelector('.genie-welcome');
                    if (welcome) welcome.remove();
                    
                    this.messages.forEach(msg => {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = `genie-message ${msg.role}`;
                        if (msg.content.includes('<')) {
                            messageDiv.innerHTML = msg.content;
                        } else {
                            messageDiv.textContent = msg.content;
                        }
                        this.elements.messages.appendChild(messageDiv);
                    });
                }
                
                console.log('📂 State loaded from localStorage');
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
    }
    
    /**
     * Escape HTML to prevent XSS attacks
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Genie Chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Genie Chat...');
    new GenieChat();
});
