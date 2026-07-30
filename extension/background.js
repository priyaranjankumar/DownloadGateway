chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send-to-gateway',
    title: 'Send to Download Gateway',
    contexts: ['link', 'image', 'video', 'audio'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'send-to-gateway') return;

  const url = info.linkUrl || info.srcUrl;
  if (!url) return;
  
  const { gatewayUrl, apiToken } = await chrome.storage.sync.get(['gatewayUrl', 'apiToken']);
  if (!gatewayUrl || !apiToken) {
    chrome.action.setBadgeText({ text: '!', tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: tab.id }), 3000);
    return;
  }
  
  try {
    const response = await fetch(`${gatewayUrl}/api/downloads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ uris: [url] }),
    });
    
    if (response.ok) {
      chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
      setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: tab.id }), 3000);
    } else {
      chrome.action.setBadgeText({ text: '✗', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: tab.id }), 3000);
    }
  } catch (err) {
    chrome.action.setBadgeText({ text: '✗', tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: tab.id }), 3000);
  }
});
