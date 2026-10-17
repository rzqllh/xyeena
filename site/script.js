(function () {
  'use strict';

  var copyBtn = document.getElementById('copy-btn');
  var installCmd = document.getElementById('install-cmd');
  var copyStatus = document.getElementById('copy-status');
  var resetTimer = null;

  if (!copyBtn || !installCmd) return;

  function setFeedback(text, isError) {
    if (copyStatus) {
      copyStatus.textContent = text;
      copyStatus.style.color = isError ? 'var(--color-status-staging)' : 'var(--color-status-live)';
    }
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      if (copyStatus) copyStatus.textContent = '';
      copyBtn.textContent = 'Copy';
    }, 3000);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        var ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) resolve();
        else reject(new Error('execCommand failed'));
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  copyBtn.addEventListener('click', function () {
    var text = installCmd.textContent.trim();
    copyText(text).then(function () {
      copyBtn.textContent = 'Copied';
      setFeedback('Command copied to clipboard.', false);
    }).catch(function () {
      copyBtn.textContent = 'Select manually';
      setFeedback('Could not copy automatically. Please select text manually.', true);
    });
  });
})();
