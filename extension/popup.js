document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const urlInput = document.getElementById('urlInput');
  const dirInput = document.getElementById('dirInput');
  const downloadBtn = document.getElementById('downloadBtn');
  const captureTabBtn = document.getElementById('captureTabBtn');
  const messageArea = document.getElementById('messageArea');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const optionsBtn = document.getElementById('optionsBtn');
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const downloadsList = document.getElementById('downloadsList');
  const activityBadge = document.getElementById('activityBadge');
  
  // Stats
  const downSpeedEl = document.getElementById('downSpeed');
  const upSpeedEl = document.getElementById('upSpeed');
  const activeCountEl = document.getElementById('activeCount');

  let gatewayUrl = '';
  let apiToken = '';
  let pollInterval = null;

  // Open options page
  optionsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  // Tab Navigation
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Load extension credentials
  const creds = await chrome.storage.sync.get(['gatewayUrl', 'apiToken']);
  gatewayUrl = creds.gatewayUrl || '';
  apiToken = creds.apiToken || '';

  if (!gatewayUrl || !apiToken) {
    updateStatus(false, 'Not Configured');
    showMessage('Please set Gateway URL & Token in Settings.', 'error');
    return;
  }

  // Pre-fill active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0 && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
      urlInput.value = tabs[0].url;
    }
  });

  captureTabBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].url) {
        urlInput.value = tabs[0].url;
      }
    });
  });

  // Check health and start polling
  checkHealthAndFetch();
  pollInterval = setInterval(fetchDownloads, 2000);

  // Clean up timer on close
  window.addEventListener('unload', () => {
    if (pollInterval) clearInterval(pollInterval);
  });

  // Handle Download Submission
  downloadBtn.addEventListener('click', async () => {
    const urls = urlInput.value.split('\n').map(u => u.trim()).filter(u => u);
    const dir = dirInput.value.trim();

    if (urls.length === 0) {
      showMessage('Please enter at least one URL.', 'error');
      return;
    }

    downloadBtn.disabled = true;
    showMessage('Queuing download...', '');

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
        showMessage('Download task added successfully! 🎉', 'success');
        urlInput.value = '';
        fetchDownloads(); // Refresh list immediately
        setTimeout(() => {
          // Switch to activity tab
          document.querySelector('[data-tab="activityTab"]').click();
        }, 800);
      } else {
        const errData = await res.json().catch(() => ({}));
        showMessage(`Error: ${errData.detail || res.statusText}`, 'error');
      }
    } catch (err) {
      showMessage(`Network error: ${err.message}`, 'error');
    } finally {
      downloadBtn.disabled = false;
    }
  });

  // Fetch health & downloads
  async function checkHealthAndFetch() {
    try {
      const res = await fetch(`${gatewayUrl}/api/health`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      if (res.ok) {
        updateStatus(true, 'Online');
        fetchDownloads();
      } else {
        updateStatus(false, 'Unauthorized');
      }
    } catch (e) {
      updateStatus(false, 'Offline');
    }
  }

  async function fetchDownloads() {
    if (!gatewayUrl || !apiToken) return;
    try {
      const res = await fetch(`${gatewayUrl}/api/downloads`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      if (!res.ok) return;

      const downloads = await res.json();
      renderDownloads(downloads);
      updateStatus(true, 'Online');
    } catch (e) {
      // Silent error on poll
    }
  }

  function renderDownloads(downloads) {
    if (!Array.isArray(downloads)) return;

    activityBadge.textContent = downloads.length;

    let totalDownSpeed = 0;
    let totalUpSpeed = 0;
    let activeCount = 0;

    downloads.forEach(d => {
      const speed = parseInt(d.downloadSpeed || d.download_speed || 0);
      const upSpeed = parseInt(d.uploadSpeed || d.upload_speed || 0);
      totalDownSpeed += speed;
      totalUpSpeed += upSpeed;
      if (d.status === 'active' || d.status === 'downloading') activeCount++;
    });

    downSpeedEl.textContent = formatBytes(totalDownSpeed) + '/s';
    upSpeedEl.textContent = formatBytes(totalUpSpeed) + '/s';
    activeCountEl.textContent = activeCount;

    if (downloads.length === 0) {
      downloadsList.innerHTML = `
        <div class="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>No active downloads</p>
        </div>
      `;
      return;
    }

    downloadsList.innerHTML = downloads.map(d => {
      const total = parseInt(d.totalLength || d.total_length || 0);
      const completed = parseInt(d.completedLength || d.completed_length || 0);
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const speed = formatBytes(parseInt(d.downloadSpeed || d.download_speed || 0)) + '/s';
      const name = d.name || d.files?.[0]?.path?.split('/')?.pop() || d.gid || 'Download Task';

      return `
        <div class="download-card" data-gid="${d.gid}">
          <div class="card-top">
            <span class="card-title" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
            <div class="card-actions">
              ${d.status === 'active' ? `
                <button class="mini-icon-btn action-pause" data-gid="${d.gid}" title="Pause">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                </button>
              ` : `
                <button class="mini-icon-btn action-resume" data-gid="${d.gid}" title="Resume">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
              `}
              <button class="mini-icon-btn action-delete" data-gid="${d.gid}" title="Cancel/Delete">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${percent}%"></div>
          </div>
          <div class="card-meta">
            <span>${percent}% • ${formatBytes(completed)} / ${total > 0 ? formatBytes(total) : '∞'}</span>
            <span>${d.status === 'active' ? speed : d.status}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    document.querySelectorAll('.action-pause').forEach(btn => {
      btn.addEventListener('click', () => controlDownload(btn.dataset.gid, 'pause'));
    });
    document.querySelectorAll('.action-resume').forEach(btn => {
      btn.addEventListener('click', () => controlDownload(btn.dataset.gid, 'unpause'));
    });
    document.querySelectorAll('.action-delete').forEach(btn => {
      btn.addEventListener('click', () => controlDownload(btn.dataset.gid, 'remove'));
    });
  }

  async function controlDownload(gid, action) {
    try {
      await fetch(`${gatewayUrl}/api/downloads/${gid}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      fetchDownloads();
    } catch (e) {}
  }

  function updateStatus(connected, text) {
    statusBadge.className = `status-badge ${connected ? 'connected' : 'disconnected'}`;
    statusText.textContent = text;
  }

  function showMessage(msg, type) {
    messageArea.textContent = msg;
    messageArea.className = type ? `message-banner ${type}` : 'message-banner';
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
