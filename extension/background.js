// Create context menu items on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'send-to-gateway',
      title: 'Send to Download Gateway',
      contexts: ['page', 'selection', 'link', 'image', 'video', 'audio'],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'send-to-gateway') return;

  let targetUrl = info.linkUrl || info.srcUrl;

  // 1. Check selected text if user highlighted a URL or magnet link
  if (!targetUrl && info.selectionText) {
    const trimmed = info.selectionText.trim();
    if (isValidUrl(trimmed)) {
      targetUrl = trimmed;
    }
  }

  // 2. Read clipboard via active tab execution (reliable in Manifest V3)
  if (!targetUrl && tab?.id) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return navigator.clipboard.readText().catch(() => null);
        },
      });

      const clipText = results?.[0]?.result;
      if (clipText && isValidUrl(clipText.trim())) {
        targetUrl = clipText.trim();
      }
    } catch (e) {
      console.log('Tab clipboard script error:', e);
    }
  }

  // 3. Fallback: check if page URL itself is a direct file download link
  if (!targetUrl && info.pageUrl && isDirectFileUrl(info.pageUrl)) {
    targetUrl = info.pageUrl;
  }

  // If no valid downloadable URL found, show error badge (do NOT download HTML webpage)
  if (!targetUrl) {
    showBadge(tab.id, '!', '#ef4444');
    return;
  }

  // Get credentials
  const { gatewayUrl, apiToken } = await chrome.storage.sync.get(['gatewayUrl', 'apiToken']);
  if (!gatewayUrl || !apiToken) {
    showBadge(tab.id, '!', '#ef4444');
    return;
  }

  try {
    const response = await fetch(`${gatewayUrl}/api/downloads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ uris: [targetUrl] }),
    });

    if (response.ok) {
      showBadge(tab.id, '✓', '#10b981');
    } else {
      showBadge(tab.id, '✗', '#ef4444');
    }
  } catch (err) {
    showBadge(tab.id, '✗', '#ef4444');
  }
});

function isValidUrl(str) {
  if (!str) return false;
  const s = str.trim();
  return /^(https?:\/\/|ftp:\/\/|magnet:\?)/i.test(s);
}

function isDirectFileUrl(url) {
  if (!url) return false;
  // Exclude standard web page routes
  if (url.includes('seedr.cc/files') || url.includes('seedr.cc/media')) return false;
  return /\.(zip|rar|7z|tar|gz|iso|exe|dmg|mkv|mp4|avi|mov|mp3|flac|pdf|epub)$/i.test(url);
}

function showBadge(tabId, text, color) {
  if (!tabId) return;
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '', tabId });
  }, 3000);
}
