(function () {
  function setSiteBlock() {

    if(!document.getElementById('monsters-pomo-overlay')) {
      var overlay = document.createElement('div');
      overlay.id = 'monsters-pomo-overlay';
      overlay.style.position = 'fixed';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = 10000000;
      overlay.style.left = 0;
      overlay.style.top = 0;

      var img = document.createElement('img');
      img.src = chrome.extension.getURL('james_sullivan_huge.jpg');
      img.style.height = "100%";
      img.style.width = "100%";
      overlay.appendChild(img);

      document.body.appendChild(overlay);
    }
  }
  
  if(typeof document === 'undefined') {
    window.addEventListener("DOMContentLoaded", setSiteBlock);
  } else {
    setSiteBlock();
  }
})();
