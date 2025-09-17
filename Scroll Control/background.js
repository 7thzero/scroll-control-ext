// background.js
const storageAPI = typeof browser !== 'undefined' ? browser : chrome;

storageAPI.runtime.onInstalled.addListener(() => {
  // Set default values
  storageAPI.storage.sync.set({
    websites: ['facebook.com', 'reddit.com', 'twitter.com', 'instagram.com'],
    scrollLimit: 15
  });
});
