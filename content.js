(() => {
  "use strict";

  /* ========== CONFIGURATION ========== */

  // 2-A.  Navigation items that should vanish (top bar links, old list retained)
  const NAV_SELECTORS = [
    'a[href*="/marketplace"]',
    'a[href*="/watch"]',
    'a[href*="/gaming"]',
    'a[href="/reel/create/"]',
    'a[aria-label="Marketplace"]',
    'a[aria-label="Watch"]',
    'a[aria-label="Video"]',
    'a[aria-label="Gaming"]',
    'a[aria-label="Reels"]'
  ];

  // 2-B.  Left-hand column, right-hand column and Reels modules  <<< NEW
  /* ===== LEFT & RIGHT SIDEBAR SELECTORS =====
   • Removed the broad div[role="navigation"] selector so the top bar stays.
   • No other logic changed. */
  const LEFT_SIDEBAR_SELECTORS  = [
    'div[data-pagelet="LeftRail"]'          // ← left column
    // add extra hooks here if Facebook renames LeftRail
  ];

const RIGHT_SIDEBAR_SELECTORS = [
  'div[data-pagelet="RightRail"]',
//   'aside[role="complementary"]'
];


  const REELS_SELECTORS = [
    'div[aria-label="Reels"]',
    'div[aria-label="Reels and short videos"]',
    'div[data-pagelet="ReelsTrayContainer"]',
    'div[data-pagelet^="VideoReelsChannel_"]',
    'div[data-pagelet^="FeedUnit_Reel"]',
    'div[data-pagelet="ReelStoriesTray"]',
    'a[href*="/reel/"]'
  ];

  // Existing People-You-May-Know phrases
  const PYMK_PHRASES = [
    "People you may know",
    "People You May Know",
    "PEOPLE YOU MAY KNOW"
  ];

  /* ========== UTILITY FUNCTIONS ========== */

  const hideElement = el => {
    if (!el || el.dataset.fbHidden) return;
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('height', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    el.dataset.fbHidden = 'true';
  };

  const hideBySelectorArray = selectorArray => {
    selectorArray.forEach(sel => {
      document.querySelectorAll(sel).forEach(hideElement);
    });
  };

  /* ========== HIDE FUNCTIONS ========== */

  const hideNavElements = () => {
    NAV_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(a => {
        const listItem = a.closest('[role="listitem"]') || a.closest('li') || a.closest('div[data-testid]');
        hideElement(listItem || a);
      });
    });
  };

  const hideSidebarsAndReels = root => {
    // root parameter lets us target either a subtree or the full doc
    const ctx = root.querySelectorAll ? root : document;

    hideBySelectorArray.call(null, LEFT_SIDEBAR_SELECTORS);
    hideBySelectorArray.call(null, RIGHT_SIDEBAR_SELECTORS);
    hideBySelectorArray.call(null, REELS_SELECTORS);

    // For good measure, nuke any Reels *articles* detected via inner text
    ctx.querySelectorAll('[role="article"]').forEach(article => {
      if (article.dataset.fbHidden) return;
      const txt = article.textContent || '';
      if (/\bReels?\b/i.test(txt)) hideElement(article);
    });
  };

  const hidePYMKElements = root => {
    const ctx = root.querySelectorAll ? root : document;

    // Method 1 – explicit PYMK pagelets
    ['div[aria-label="People You May Know"]',
     'div[data-testid="friend_suggestions_unit"]',
     'div[data-pagelet="FeedUnit_PYMK"]']
      .forEach(sel => ctx.querySelectorAll(sel).forEach(hideElement));

    // Method 2 – scan content for phrases
    ctx.querySelectorAll('[role="article"]').forEach(article => {
      if (article.dataset.fbHidden) return;
      const txt = article.textContent || '';
      if (PYMK_PHRASES.some(p => txt.toLowerCase().includes(p.toLowerCase())))
        hideElement(article);
    });
  };

  /* ========== MAIN CLEANUP ========== */

  const cleanFacebook = root => {
    hideNavElements();
    hideSidebarsAndReels(root);
    hidePYMKElements(root);
  };

  /* ========== INITIALISATION ========== */

  // Initial sweep after page load
  setTimeout(() => cleanFacebook(document), 500);

  // Observe DOM mutations
  const observer = new MutationObserver(mutations => {
    let dirty = false;
    mutations.forEach(m => {
      if (m.addedNodes.length) {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            dirty = true;
            // clean new node immediately
            cleanFacebook(node);
          }
        });
      }
    });
    if (dirty) setTimeout(() => cleanFacebook(document), 200);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Fallback periodic cleanup
  setInterval(() => cleanFacebook(document), 3000);

  console.log('Facebook Cleaner: hiding nav, sidebars, Reels & PYMK');
})();
