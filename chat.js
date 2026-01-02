// Global variables
let currentUser = null;

// DOM elements
const userEmailSpan = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messagesContainer');
const sendBtn = document.getElementById('sendBtn');

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        userEmailSpan.textContent = user.email;
        console.log('User logged in:', user.email);
        
        // Load messages
        loadMessages();
    } else {
        // No user is signed in, redirect to login
        console.log('No user logged in, redirecting to login page');
        // Use multiple redirect methods for compatibility
        try {
            window.location.replace('index.html');
        } catch (e) {
            window.location.href = 'index.html';
        }
    }
});

// Logout functionality - UPDATED FIX
logoutBtn.addEventListener('click', async () => {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;
    
    try {
        await auth.signOut();
        console.log('User logged out successfully');
        
        // Use replace instead of href to prevent back button issues
        window.location.replace('index.html');
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
});

// Send message functionality
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        return;
    }
    
    if (!currentUser) {
        alert('You must be logged in to send messages');
        return;
    }
    
    // Disable send button
    setButtonLoading(true);
    
    try {
        // Add message to Firestore
        await db.collection('messages').add({
            text: messageText,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: currentUser.displayName || currentUser.email.split('@')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        });
        
        // Clear input
        messageInput.value = '';
        console.log('Message sent successfully');
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message: ' + error.message);
    } finally {
        setButtonLoading(false);
        messageInput.focus();
    }
});

// Load messages from Firestore
function loadMessages() {
    // Show loading state
    messagesContainer.innerHTML = '<div class="loading-message">Loading messages...</div>';
    
    // Listen for real-time updates
    db.collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(100) // Load last 100 messages
        .onSnapshot((snapshot) => {
            // Clear container
            messagesContainer.innerHTML = '';
            
            if (snapshot.empty) {
                messagesContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No messages yet</p>
                        <p>Be the first to send a message!</p>
                    </div>
                `;
                return;
            }
            
            // Display each message
            snapshot.forEach((doc) => {
                const message = doc.data();
                displayMessage(message);
            });
            
            // Scroll to bottom
            scrollToBottom();
        }, (error) => {
            console.error('Error loading messages:', error);
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <p>Error loading messages</p>
                    <p>${error.message}</p>
                    <p>Please refresh the page</p>
                </div>
            `;
        });
}

// Display a message in the chat
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    const isOwnMessage = currentUser && message.userId === currentUser.uid;
    
    messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
    
    const time = message.timestamp 
        ? formatTime(message.timestamp.toDate()) 
        : formatTime(new Date(message.createdAt));
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${!isOwnMessage ? `<div class="message-sender">${escapeHtml(message.userName)}</div>` : ''}
            <div class="message-text">${escapeHtml(message.text)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
}

// Format timestamp
function formatTime(date) {
    const now = new Date();
    const messageDate = new Date(date);
    
    const isToday = now.toDateString() === messageDate.toDateString();
    
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    
    if (isToday) {
        return `${hours}:${minutes}`;
    } else {
        const day = messageDate.getDate().toString().padStart(2, '0');
        const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month} ${hours}:${minutes}`;
    }
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll to bottom of messages
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Set button loading state
function setButtonLoading(isLoading) {
    const sendText = document.getElementById('sendText');
    const sendSpinner = document.getElementById('sendSpinner');
    
    if (isLoading) {
        sendBtn.disabled = true;
        sendText.textContent = 'Sending...';
        sendSpinner.classList.remove('d-none');
    } else {
        sendBtn.disabled = false;
        sendText.textContent = 'Send';
        sendSpinner.classList.add('d-none');
    }
}

// Auto-scroll when new messages arrive
const observer = new MutationObserver(() => {
    const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 100;
    if (isScrolledToBottom) {
        scrollToBottom();
    }
});

observer.observe(messagesContainer, { childList: true });

// Allow sending with Enter key
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});

console.log('Chat.js loaded successfully');