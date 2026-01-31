// AI Survival Assistant - Background Service Worker

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    // Create context menu for selected text
    chrome.contextMenus.create({
        id: 'askAI',
        title: 'Ask AI Assistant about "%s"',
        contexts: ['selection']
    });
    
    chrome.contextMenus.create({
        id: 'improveText',
        title: 'Improve this text with AI',
        contexts: ['selection']
    });
    
    chrome.contextMenus.create({
        id: 'explainText',
        title: 'Explain this with AI',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const selectedText = info.selectionText;
    
    let prompt = '';
    
    switch(info.menuItemId) {
        case 'askAI':
            prompt = `Tell me about: ${selectedText}`;
            break;
        case 'improveText':
            prompt = `Improve this text professionally: "${selectedText}"`;
            break;
        case 'explainText':
            prompt = `Explain this in simple terms: "${selectedText}"`;
            break;
    }
    
    // Open popup and send message
    chrome.action.openPopup();
    
    // Wait a bit for popup to load, then send message
    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: 'analyzeText',
            text: prompt
        });
    }, 100);
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getApiKey') {
        chrome.storage.local.get(['geminiApiKey'], (result) => {
            sendResponse({ apiKey: result.geminiApiKey || '' });
        });
        return true; // Keep channel open for async response
    }
    
    if (request.action === 'saveApiKey') {
        chrome.storage.local.set({ geminiApiKey: request.apiKey }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Popup is already configured in manifest, so this is just a fallback
    chrome.action.openPopup();
});
