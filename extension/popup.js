document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('urlInput');
  const dirInput = document.getElementById('dirInput');
  const downloadBtn = document.getElementById('downloadBtn');
  const messageArea = document.getElementById('messageArea');
  const statusIndicator = document.getElementById('statusIndicator');
  const optionsLink = document.getElementById('optionsLink');

  optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  // Load configuration
  const { gatewayUrl, apiToken } = await chrome.storage.sync.get(['gatewayUrl', 'apiToken']);

  if (!gatewayUrl || !apiToken) {
    statusIndicator.className = 'status-disconnected';
    statusIndicator.title = 'Missing configuration. Click Settings.';
    showMessage('Please configure the extension in Settings.', 'error');
    return;
  }

  // Pre-fill URL from active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0 && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
      urlInput.value = tabs[0].url;
    }
  });

  // Check connection health
  try {
    const res = await fetch(`${gatewayUrl}/api/health`, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    if (res.ok) {
      statusIndicator.className = 'status-connected';
      statusIndicator.title = 'Connected';
    } else {
      statusIndicator.className = 'status-disconnected';
      statusIndicator.title = 'Connection error';
    }
  } catch (e) {
    statusIndicator.className = 'status-disconnected';
    statusIndicator.title = 'Cannot reach gateway';
  }

  downloadBtn.addEventListener('click', async () => {
    const urls = urlInput.value.split('\n').map(u => u.trim()).filter(u => u);
    const dir = dirInput.value.trim();

    if (urls.length === 0) {
      showMessage('Please enter at least one URL.', 'error');
      return;
    }

    downloadBtn.disabled = true;
    showMessage('Sending...', '');

    try {
      const payload = { uris: urls };
      if (dir) {
        payload.options = { dir: dir };
      }

      const res = await fetch(`${gatewayUrl}/api/downloads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showMessage('Download(s) queued successfully!', 'success');
        setTimeout(() => window.close(), 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showMessage(`Error: ${errorData.detail || res.statusText}`, 'error');
      }
    } catch (e) {
      showMessage(`Network error: ${e.message}`, 'error');
    } finally {
      downloadBtn.disabled = false;
    }
  });

  function showMessage(msg, type) {
    messageArea.textContent = msg;
    messageArea.className = type ? `msg-${type}` : '';
  }
});
