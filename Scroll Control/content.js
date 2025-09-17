// content.js
(function() {
  let maxScrollPosition = 0;
  let allowedScrolls = 0;
  let isLimited = false;
  let websiteList = [];
  let touchStartY = 0;
  let touchStartScrollTop = 0;
  let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  function shouldLimitSite() {
    const currentDomain = window.location.hostname;
    return websiteList.some(site => {
      const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const cleanCurrent = currentDomain.replace(/^www\./, '');
      return cleanCurrent.includes(cleanSite) || cleanSite.includes(cleanCurrent);
    });
  }

  function loadSettings() {
    const storageAPI = typeof browser !== 'undefined' ? browser : chrome;

    storageAPI.storage.sync.get(['websites', 'scrollLimit'])
      .then(function(result) {
        if (!result) {
          console.warn('Storage result is undefined, using defaults');
          result = {};
        }

        websiteList = result.websites || ['facebook.com', 'reddit.com', 'twitter.com', 'instagram.com'];
        allowedScrolls = parseInt(result.scrollLimit) || 15;

        if (shouldLimitSite()) {
          isLimited = true;
          initScrollLimiter();
        }
      })
      .catch(function(error) {
        console.error('Error loading settings:', error);
        websiteList = ['facebook.com', 'reddit.com', 'twitter.com', 'instagram.com'];
        allowedScrolls = 15;

        if (shouldLimitSite()) {
          isLimited = true;
          initScrollLimiter();
        }
      });
  }

  function getScrollUnit() {
    return window.innerHeight * 0.8;
  }

  function initScrollLimiter() {
    if (!isLimited) return;

    maxScrollPosition = allowedScrolls * getScrollUnit();

    window.addEventListener('scroll', handleScroll, { passive: false });

    if (!isMobile) {
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeydown, { passive: false });
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    updateScrollIndicator();
  }

  function handleScroll(e) {
    if (!isLimited) return;

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScrollTop > maxScrollPosition) {
      window.scrollTo(0, maxScrollPosition);
      showLimitMessage();
      return;
    }

    updateScrollIndicator();
  }

  function handleWheel(e) {
    if (!isLimited || isMobile) return;

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const futureScrollTop = currentScrollTop + (e.deltaY * 3);

    if (e.deltaY > 0 && futureScrollTop > maxScrollPosition) {
      e.preventDefault();
      window.scrollTo(0, maxScrollPosition);
      showLimitMessage();
      return false;
    }
  }

  function handleKeydown(e) {
    if (!isLimited || isMobile) return;

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const blockedKeys = [34, 40, 32];

    if (blockedKeys.includes(e.keyCode)) {
      let futureScrollTop = currentScrollTop;

      if (e.keyCode === 34) futureScrollTop += window.innerHeight;
      else if (e.keyCode === 40) futureScrollTop += 50;
      else if (e.keyCode === 32) futureScrollTop += window.innerHeight * 0.8;

      if (futureScrollTop > maxScrollPosition) {
        e.preventDefault();
        window.scrollTo(0, maxScrollPosition);
        showLimitMessage();
        return false;
      }
    }
  }

  function handleTouchStart(e) {
    if (!isLimited) return;

    touchStartY = e.touches[0].clientY;
    touchStartScrollTop = window.pageYOffset || document.documentElement.scrollTop;
  }

  function handleTouchMove(e) {
    if (!isLimited) return;

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const touchCurrentY = e.touches[0].clientY;
    const touchDelta = touchStartY - touchCurrentY;

    if (touchDelta > 0 && currentScrollTop >= maxScrollPosition - 10) {
      e.preventDefault();
      window.scrollTo(0, maxScrollPosition);
      showLimitMessage();
      return false;
    }

    if (currentScrollTop > maxScrollPosition) {
      e.preventDefault();
      window.scrollTo(0, maxScrollPosition);
      return false;
    }
  }

  function handleTouchEnd(e) {
    if (!isLimited) return;

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScrollTop > maxScrollPosition) {
      window.scrollTo(0, maxScrollPosition);
      showLimitMessage();
    }
  }

  // Fixed: Using safe DOM creation instead of innerHTML
  function showLimitMessage() {
    if (document.getElementById('scroll-limit-message')) return;

    const messageContainer = document.createElement('div');
    messageContainer.id = 'scroll-limit-message';

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: ${isMobile ? '10px' : '20px'};
      left: 50%;
      transform: translateX(-50%);
      background: #ff4444;
      color: white;
      padding: ${isMobile ? '12px 16px' : '15px'};
      border-radius: 8px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: ${isMobile ? '16px' : '14px'};
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      max-width: ${isMobile ? '90vw' : '400px'};
      text-align: center;
    `;

    const messageText = document.createElement('div');
    messageText.textContent = 'Scroll limit reached!';

    const subText = document.createElement('small');
    subText.style.fontSize = isMobile ? '14px' : '12px';
    subText.textContent = 'You can scroll up and down within the allowed area';

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      margin-left: 10px;
      cursor: pointer;
      font-size: ${isMobile ? '20px' : '16px'};
      padding: 5px;
    `;
    closeButton.onclick = () => messageContainer.remove();

    messageDiv.appendChild(messageText);
    messageDiv.appendChild(document.createElement('br'));
    messageDiv.appendChild(subText);
    messageDiv.appendChild(closeButton);
    messageContainer.appendChild(messageDiv);

    document.body.appendChild(messageContainer);

    setTimeout(() => {
      const msg = document.getElementById('scroll-limit-message');
      if (msg) msg.remove();
    }, 4000);
  }

  // Fixed: Using safe DOM creation instead of innerHTML
  function updateScrollIndicator() {
    let indicator = document.getElementById('scroll-indicator');

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'scroll-indicator';
      indicator.style.cssText = `
        position: fixed;
        ${isMobile ? 'bottom: 10px; left: 10px;' : 'bottom: 20px; right: 20px;'}
        background: rgba(0,0,0,0.8);
        color: white;
        padding: ${isMobile ? '8px 12px' : '10px'};
        border-radius: 6px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: ${isMobile ? '14px' : '12px'};
        min-width: ${isMobile ? '100px' : '120px'};
        backdrop-filter: blur(10px);
      `;
      document.body.appendChild(indicator);
    }

    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollProgress = Math.min(currentScrollTop / maxScrollPosition, 1);
    const progressPercent = Math.round(scrollProgress * 100);

    // Clear existing content
    indicator.textContent = '';

    const limitDiv = document.createElement('div');
    limitDiv.style.marginBottom = '4px';
    limitDiv.textContent = `Limit: ${allowedScrolls}`;

    const progressDiv = document.createElement('div');
    progressDiv.style.marginBottom = '6px';
    progressDiv.textContent = `${progressPercent}%`;

    const progressBarContainer = document.createElement('div');
    progressBarContainer.style.cssText = `
      background: #333; 
      height: ${isMobile ? '6px' : '4px'}; 
      border-radius: 3px;
    `;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      background: ${progressPercent >= 100 ? '#ff4444' : '#4CAF50'}; 
      height: 100%; 
      width: ${progressPercent}%; 
      border-radius: 3px; 
      transition: all 0.3s;
    `;

    progressBarContainer.appendChild(progressBar);
    indicator.appendChild(limitDiv);
    indicator.appendChild(progressDiv);
    indicator.appendChild(progressBarContainer);
  }

  function resetScrollLimit() {
    maxScrollPosition = 0;
    const indicator = document.getElementById('scroll-indicator');
    if (indicator) indicator.remove();
    const message = document.getElementById('scroll-limit-message');
    if (message) message.remove();
  }

  let currentUrl = window.location.href;
  setInterval(() => {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href;
      resetScrollLimit();
      loadSettings();
    }
  }, 1000);

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (isLimited) {
        maxScrollPosition = allowedScrolls * getScrollUnit();
        updateScrollIndicator();
      }
    }, 500);
  });

  window.addEventListener('resize', () => {
    if (isLimited) {
      maxScrollPosition = allowedScrolls * getScrollUnit();
      updateScrollIndicator();
    }
  });

  loadSettings();
})();
