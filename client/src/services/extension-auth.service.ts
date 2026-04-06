/**
 * Extension Auth Service
 * Syncs auth token from the web app to the DealEval Chrome extension.
 * The extension receives the token via chrome.runtime.sendMessage (externally_connectable)
 * so users don't need to log in separately in the extension popup.
 */

// Extension ID — update this after publishing to Chrome Web Store
// For local unpacked extension, find it at chrome://extensions
const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || '';

function getApiBase(): string {
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
}

function isExtensionAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.sendMessage;
}

/**
 * Send auth token to the extension. Called automatically on login/register.
 * Fire-and-forget — does not block the user if extension is not installed.
 */
export function syncTokenToExtension(token: string, email?: string): void {
  if (!isExtensionAvailable() || !EXTENSION_ID) return;

  try {
    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { action: 'setAuthToken', token, apiBase: getApiBase(), email: email || '' },
      (response: any) => {
        if (chrome.runtime.lastError) {
          // Extension not installed or not responding — silent fail
          return;
        }
        if (response?.success) {
          console.log('[DealEval] Auth synced to extension');
        }
      }
    );
  } catch {
    // Extension not available — silent fail
  }
}

/**
 * Clear auth token from the extension. Called on logout.
 */
export function clearTokenFromExtension(): void {
  if (!isExtensionAvailable() || !EXTENSION_ID) return;

  try {
    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { action: 'clearAuthToken' },
      () => {
        if (chrome.runtime.lastError) return;
      }
    );
  } catch {
    // Silent fail
  }
}

/**
 * Check if extension is installed and connected.
 */
export function checkExtensionStatus(): Promise<{ installed: boolean; authenticated: boolean; email: string }> {
  if (!isExtensionAvailable() || !EXTENSION_ID) {
    return Promise.resolve({ installed: false, authenticated: false, email: '' });
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { action: 'getAuthStatus' },
        (response: any) => {
          if (chrome.runtime.lastError || !response) {
            resolve({ installed: false, authenticated: false, email: '' });
          } else {
            resolve({ installed: true, authenticated: response.authenticated, email: response.email || '' });
          }
        }
      );
    } catch {
      resolve({ installed: false, authenticated: false, email: '' });
    }

    // Timeout after 2 seconds
    setTimeout(() => resolve({ installed: false, authenticated: false, email: '' }), 2000);
  });
}
