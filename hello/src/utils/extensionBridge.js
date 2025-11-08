// Add this script to your frontend (src/utils/extensionBridge.js)
// This allows your website to communicate with the Chrome extension

/**
 * Extension Bridge - Connects your website to the Chrome extension
 * Usage: Import this in your Login/OAuth callback components
 */

export const ExtensionBridge = {
  /**
   * Check if the Chrome extension is installed
   */
  isExtensionInstalled: async () => {
    try {
      // Try to send a message to the extension
      return new Promise((resolve) => {
        if (!window.chrome?.runtime) {
          resolve(false);
          return;
        }

        // Extension ID - You'll need to replace this with your actual extension ID
        const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE';
        
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { action: 'ping' },
          (response) => {
            resolve(!!response);
          }
        );

        // Timeout after 1 second
        setTimeout(() => resolve(false), 1000);
      });
    } catch (error) {
      return false;
    }
  },

  /**
   * Send authentication tokens to the extension
   * Call this after successful login
   */
  sendTokensToExtension: (accessToken, refreshToken) => {
    try {
      // Store in localStorage (extension will capture this)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Also try to send directly if possible
      if (window.chrome?.runtime) {
        chrome.runtime.sendMessage({
          action: 'loginSuccess',
          accessToken,
          refreshToken
        });
      }

      console.log('✅ Tokens sent to extension');
      return true;
    } catch (error) {
      console.error('Failed to send tokens to extension:', error);
      return false;
    }
  },

  /**
   * Notify extension of logout
   */
  notifyExtensionLogout: () => {
    try {
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Notify extension
      if (window.chrome?.runtime) {
        chrome.runtime.sendMessage({
          action: 'logoutSuccess'
        });
      }

      console.log('✅ Logout notification sent to extension');
      return true;
    } catch (error) {
      console.error('Failed to notify extension of logout:', error);
      return false;
    }
  },

  /**
   * Get tokens from extension (useful for syncing)
   */
  getTokensFromExtension: async () => {
    try {
      return new Promise((resolve) => {
        if (!window.chrome?.runtime) {
          resolve(null);
          return;
        }

        chrome.runtime.sendMessage(
          { action: 'getTokens' },
          (response) => {
            resolve(response);
          }
        );

        setTimeout(() => resolve(null), 1000);
      });
    } catch (error) {
      console.error('Failed to get tokens from extension:', error);
      return null;
    }
  }
};

// Auto-detect and sync tokens on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Check if we have tokens in localStorage
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      // Try to send to extension
      ExtensionBridge.sendTokensToExtension(accessToken, refreshToken);
    }
  });
}