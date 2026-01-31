// AI Survival Assistant - Final Version v6 (Secure & Onboarding)
// Updated: Jan 31, 2026
// Model: gemini-2.5-flash

let apiKey = '';
let conversationHistory = [];

chrome.storage.local.get(['geminiApiKey', 'conversationHistory'], (result) => {
    if (result.geminiApiKey) apiKey = result.geminiApiKey;
    if (result.conversationHistory) {
        conversationHistory = result.conversationHistory;
        displayConversationHistory();
    }
});

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key');
const quickBtns = document.querySelectorAll('.quick-btn');
const linkedinBtn = document.getElementById('linkedin-btn');

if (settingsToggle) {
    settingsToggle.addEventListener('click', () => {
        settingsPanel.classList.toggle('active');
        if (settingsPanel.classList.contains('active')) {
            apiKeyInput.value = apiKey || '';
            apiKeyInput.focus();
        }
    });
}

if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
        const newKey = apiKeyInput.value.trim();
        if (newKey) {
            apiKey = newKey;
            chrome.storage.local.set({ geminiApiKey: newKey }, () => {
                settingsPanel.classList.remove('active');
                showMessage('✅ API key saved! You can now chat with your AI assistant.', 'ai');
            });
        }
    });
}

quickBtns.forEach(btn => {
    if (btn.id !== 'linkedin-btn') {
        btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-prompt');
            userInput.value = prompt;
            sendMessage();
        });
    }
});

if (linkedinBtn) {
    linkedinBtn.addEventListener('click', () => {
        const linkedinPrompt = "I'm ready to analyze your career! Please paste your LinkedIn 'About' section, job description, or resume text below, and I'll generate your AI Risk & Opportunity Report.";
        showMessage(linkedinPrompt, 'ai');
        userInput.placeholder = "Paste your professional info here...";
        userInput.focus();
    });
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 100) + 'px';
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    if (!apiKey) {
        showOnboardingGuide();
        return;
    }
    
    userInput.value = '';
    userInput.style.height = 'auto';
    userInput.placeholder = "Ask me anything...";
    
    const welcomeMsg = chatContainer.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();
    
    showMessage(message, 'user');
    conversationHistory.push({ role: 'user', content: message });
    
    typingIndicator.classList.add('active');
    sendBtn.disabled = true;
    
    try {
        const response = await callGeminiAPI(message);
        typingIndicator.classList.remove('active');
        showMessage(response, 'ai');
        conversationHistory.push({ role: 'assistant', content: response });
        saveConversationHistory();
    } catch (error) {
        typingIndicator.classList.remove('active');
        showError(error.message);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

async function callGeminiAPI(message) {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const isLinkedIn = message.toLowerCase().includes('linkedin') || message.length > 200;
    
    let systemPrompt = "You are an AI Career Assistant. Provide practical, actionable advice for workers in the age of AI. Keep responses concise (2-3 paragraphs max).";
    if (isLinkedIn) {
        systemPrompt = "You are an AI Career Strategist. Analyze the provided professional background for AI Displacement Risk, AI Opportunities, and 2 specific Future-Proofing skills. Provide a DEEP and COMPREHENSIVE analysis, but ENSURE you reach a definitive conclusion and Action Plan within the response limit. Do not cut off mid-sentence.";
    }

    const requestBody = {
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Message: ${message}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('No valid response from AI. Please try again.');
    }
    return data.candidates[0].content.parts[0].text;
}

function showMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;

    if (sender === 'ai') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = 'Copy';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.textContent = 'Done!';
                setTimeout(() => { copyBtn.innerHTML = 'Copy'; }, 1500);
            });
        });
        messageDiv.appendChild(copyBtn);
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showOnboardingGuide() {
    const guideDiv = document.createElement('div');
    guideDiv.className = 'message ai';
    guideDiv.innerHTML = `
        <div style="padding: 5px;">
            <h4 style="margin: 0 0 10px 0; color: #92FE9D;">🛡️ Secure Setup Required</h4>
            <p style="margin: 0 0 10px 0; font-size: 13px;">To protect your privacy, please add your own free Gemini API Key to start chatting.</p>
            <ol style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.6;">
                <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #00C9FF;">Google AI Studio</a>.</li>
                <li>Click <b>"Create API key"</b>.</li>
                <li>Paste it in <b>Settings (⚙️)</b> above.</li>
            </ol>
        </div>
    `;
    chatContainer.appendChild(guideDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    settingsPanel.classList.add('active');
    apiKeyInput.focus();
}

function showError(errorText) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `❌ ${errorText}`;
    chatContainer.appendChild(errorDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    setTimeout(() => { errorDiv.remove(); }, 8000);
}

function displayConversationHistory() {
    chatContainer.innerHTML = '';
    conversationHistory.forEach(msg => {
        showMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
    });
}

function saveConversationHistory() {
    const recentHistory = conversationHistory.slice(-20);
    chrome.storage.local.set({ conversationHistory: recentHistory });
}
