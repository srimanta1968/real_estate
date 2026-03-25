const SUPPORTED_PATTERNS = [
  '*://www.realtor.com/realestateandhomes-detail/*',
  '*://www.zillow.com/homedetails/*',
  '*://www.loopnet.com/Listing/*',
  '*://www.crexi.com/properties/*',
  '*://www.redfin.com/*',
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const isSupported = SUPPORTED_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(tab.url);
  });

  if (isSupported) {
    chrome.action.setIcon({
      tabId,
      path: { 16: '/icons/icon16.png', 48: '/icons/icon48.png' },
    }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACTION_COMPLETE') {
    chrome.storage.local.set({ lastExtracted: message.data });
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'Property Extracted',
      message: `${message.data.address || 'Property'} data ready to send to DealEval`,
    }).catch(() => {});

    sendResponse({ success: true });
  }

  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['token']).then(result => {
      sendResponse({ token: result.token || null });
    });
    return true;
  }
});
