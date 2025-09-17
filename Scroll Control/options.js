// options.js
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);

function loadOptions() {
  const storageAPI = typeof browser !== 'undefined' ? browser : chrome;

  storageAPI.storage.sync.get(['websites', 'scrollLimit'])
    .then((result) => {
      if (!result) result = {};

      document.getElementById('scrollLimit').value = result.scrollLimit || 5;
      document.getElementById('websites').value = (result.websites || ['facebook.com', 'reddit.com', 'twitter.com', 'instagram.com']).join('\n');
    })
    .catch((error) => {
      console.error('Error loading options:', error);
      // Set defaults on error
      document.getElementById('scrollLimit').value = 5;
      document.getElementById('websites').value = 'facebook.com\nreddit.com\ntwitter.com\ninstagram.com';
    });
}

function saveOptions() {
  const storageAPI = typeof browser !== 'undefined' ? browser : chrome;

  const scrollLimit = document.getElementById('scrollLimit').value;
  const websitesText = document.getElementById('websites').value;
  const websites = websitesText.split('\n').filter(site => site.trim()).map(site => site.trim());

  storageAPI.storage.sync.set({
    scrollLimit: parseInt(scrollLimit),
    websites: websites
  })
  .then(() => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(() => status.textContent = '', 2000);
  })
  .catch((error) => {
    console.error('Error saving options:', error);
    const status = document.getElementById('status');
    status.textContent = 'Error saving settings!';
    status.style.color = 'red';
    setTimeout(() => {
      status.textContent = '';
      status.style.color = 'green';
    }, 2000);
  });
}

function resetOptions() {
  const storageAPI = typeof browser !== 'undefined' ? browser : chrome;

  storageAPI.storage.sync.set({
    websites: ['facebook.com', 'reddit.com', 'twitter.com', 'instagram.com'],
    scrollLimit: 15
  })
  .then(() => {
    loadOptions();
    const status = document.getElementById('status');
    status.textContent = 'Settings reset to defaults!';
    setTimeout(() => status.textContent = '', 2000);
  })
  .catch((error) => {
    console.error('Error resetting options:', error);
    const status = document.getElementById('status');
    status.textContent = 'Error resetting settings!';
    status.style.color = 'red';
    setTimeout(() => {
      status.textContent = '';
      status.style.color = 'green';
    }, 2000);
  });
}
