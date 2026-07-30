document.addEventListener('DOMContentLoaded', async () => {
  const gatewayUrlInput = document.getElementById('gatewayUrl');
  const apiTokenInput = document.getElementById('apiToken');
  const toggleTokenBtn = document.getElementById('toggleTokenBtn');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusMessage = document.getElementById('statusMessage');

  // Load existing settings
  const settings = await chrome.storage.sync.get(['gatewayUrl', 'apiToken']);
  if (settings.gatewayUrl) gatewayUrlInput.value = settings.gatewayUrl;
  if (settings.apiToken) apiTokenInput.value = settings.apiToken;

  toggleTokenBtn.addEventListener('click', () => {
    if (apiTokenInput.type === 'password') {
      apiTokenInput.type = 'text';
      toggleTokenBtn.textContent = 'Hide';
    } else {
      apiTokenInput.type = 'password';
      toggleTokenBtn.textContent = 'Show';
    }
  });

  saveBtn.addEventListener('click', async () => {
    const url = gatewayUrlInput.value.trim().replace(/\/$/, ''); // Remove trailing slash
    const token = apiTokenInput.value.trim();

    await chrome.storage.sync.set({
      gatewayUrl: url,
      apiToken: token
    });

    showMessage('Settings saved!', 'success');
    setTimeout(() => showMessage('', ''), 3000);
  });

  testBtn.addEventListener('click', async () => {
    const url = gatewayUrlInput.value.trim().replace(/\/$/, '');
    const token = apiTokenInput.value.trim();

    if (!url || !token) {
      showMessage('Please enter both URL and Token', 'error');
      return;
    }

    testBtn.disabled = true;
    showMessage('Testing connection...', '');

    try {
      const res = await fetch(`${url}/api/health`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        showMessage('Connection successful!', 'success');
      } else {
        showMessage(`Connection failed: HTTP ${res.status}`, 'error');
      }
    } catch (e) {
      showMessage(`Connection failed: ${e.message}`, 'error');
    } finally {
      testBtn.disabled = false;
    }
  });

  function showMessage(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = type ? `msg-${type}` : '';
  }
});
