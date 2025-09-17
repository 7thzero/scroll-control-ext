// popup.js
document.addEventListener('DOMContentLoaded', () => {
  updateStatus();

  document.getElementById('openOptions').addEventListener('click', () => {
    const runtimeAPI = typeof browser !== 'undefined' ? browser : chrome;
    runtimeAPI.runtime.openOptionsPage();
  });

  document.getElementById('resetCurrent').addEventListener('click', () => {
    const tabsAPI = typeof browser !== 'undefined' ? browser : chrome;

    tabsAPI.tabs.query({active: true, currentWindow: true})
      .then((tabs) => {
        return tabsAPI.tabs.executeScript(tabs[0].id, {
          code: 'const indicator = document.getElementById("scroll-indicator"); if (indicator) indicator.remove(); const message = document.getElementById("scroll-limit-message"); if (message) message.remove(); window.scrollTo(0, 0); maxScrollPosition = allowedScrolls * (window.innerHeight * 0.8);'
        });
      })
      .then(() => {
        window.close();
      })
      .catch((error) => {
        console.error('Error resetting current page:', error);
        window.close();
      });
  });
});

function updateStatus() {
  const storageAPI = typeof browser !== 'undefined' ? browser : chrome;
  const tabsAPI = typeof browser !== 'undefined' ? browser : chrome;

  tabsAPI.tabs.query({active: true, currentWindow: true})
    .then((tabs) => {
      const currentDomain = new URL(tabs[0].url).hostname;

      return storageAPI.storage.sync.get(['websites', 'scrollLimit'])
        .then((result) => {
          if (!result) result = {};

          const websites = result.websites || [];
          const isLimited = websites.some(site => {
            const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
            const cleanCurrent = currentDomain.replace(/^www\./, '');
            return cleanCurrent.includes(cleanSite) || cleanSite.includes(cleanCurrent);
          });

          // Fixed: Using safe DOM manipulation instead of innerHTML
          const statusElement = document.getElementById('currentStatus');
          statusElement.textContent = '';

          if (isLimited) {
            const activeText = document.createElement('strong');
            activeText.textContent = 'Active';
            statusElement.appendChild(activeText);
            statusElement.appendChild(document.createTextNode(` on ${currentDomain}`));
            statusElement.appendChild(document.createElement('br'));
            statusElement.appendChild(document.createTextNode(`Limit: ${result.scrollLimit || 5} scrolls`));
          } else {
            const inactiveText = document.createElement('em');
            inactiveText.textContent = 'Inactive';
            statusElement.appendChild(inactiveText);
            statusElement.appendChild(document.createTextNode(` on ${currentDomain}`));
          }
        });
    })
    .catch((error) => {
      console.error('Error updating status:', error);
      document.getElementById('currentStatus').textContent = 'Error loading status';
    });
}
