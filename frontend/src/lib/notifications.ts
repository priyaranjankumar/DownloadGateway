/**
 * Browser Notification API utilities.
 *
 * Fires native OS-level notifications for critical download and VPN events.
 * Integrates with user preferences stored in the Settings page.
 */

/** Check if the Notification API is available in this browser. */
export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

/**
 * Request notification permission from the user.
 * Returns the resulting permission string.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!isNotificationSupported()) return null

  // Already granted or denied — no prompt will show
  if (Notification.permission !== 'default') {
    return Notification.permission
  }

  return Notification.requestPermission()
}

/**
 * Fire a browser notification.
 *
 * @param title   Notification heading
 * @param body    Notification body text
 * @param options Extra notification options (icon, tag, etc.)
 */
export function sendNotification(
  title: string,
  body: string,
  options?: NotificationOptions,
): void {
  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return

  const notification = new Notification(title, {
    body,
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    silent: false,
    tag: `dg-${Date.now()}`, // Unique tag to prevent stacking
    ...options,
  })

  // Auto-close after 6 seconds
  setTimeout(() => notification.close(), 6000)

  // Focus the app window when user clicks the notification
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}
