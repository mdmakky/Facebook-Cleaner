// Settings management
const settings = {
    hidePeopleYouMayKnow: true,
    hideReels: true,
    hideSponsored: false
};

// Load settings from chrome extension storage
function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['hidePeopleYouMayKnow', 'hideReels', 'hideSponsored'], (result) => {
            settings.hidePeopleYouMayKnow = result.hidePeopleYouMayKnow !== undefined ? result.hidePeopleYouMayKnow : true;
            settings.hideReels = result.hideReels !== undefined ? result.hideReels : true;
            settings.hideSponsored = result.hideSponsored !== undefined ? result.hideSponsored : false;
            hideFacebookNoise();
        });
    } else {
        // Fallback to localStorage if chrome API not available
        const saved = localStorage.getItem('facebook-cleaner-settings');
        if (saved) {
            Object.assign(settings, JSON.parse(saved));
        }
        hideFacebookNoise();
    }
}

// Listen for settings changes from extension popup/options
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateSettings') {
            Object.assign(settings, request.settings);
            // Show all hidden elements first
            showAllHiddenElements();
            // Apply new settings
            hideFacebookNoise();
            sendResponse({success: true});
        }
    });
}

// Show all previously hidden elements
function showAllHiddenElements() {
    document.querySelectorAll('[style*="display: none"]').forEach(element => {
        element.style.display = '';
    });
}

function hideSectionByHeader(headerText) {
    // Search common header tags for the section label
    document.querySelectorAll('span, strong, h2, h3, a').forEach(label => {
        if (label.innerText && label.innerText.trim().toLowerCase() === headerText.toLowerCase()) {
            // Go up DOM to find the card/container
            let container = label;
            for (let i = 0; i < 6; i++) {
                container = container.parentElement;
                if (!container) break;
                
                // Safety check: don't hide main containers
                if (container.getAttribute('role') === 'main' || 
                    container.id === 'content' ||
                    container.classList.contains('fb_content')) {
                    break;
                }
                
                // Look for boundaries: data-pagelet, role=region, or large divs
                if (
                    container.dataset.pagelet ||
                    (container.getAttribute && container.getAttribute('role') === 'region') ||
                    (container.tagName === 'DIV' && container.childElementCount > 2 && container.offsetHeight < 800)
                ) {
                    container.style.display = 'none';
                    break;
                }
            }
        }
    });
}

// Specific function to hide Reels
function hideReels() {
    if (!settings.hideReels) return;
    
    // Method 1: Look for Reels by examining specific feed units
    document.querySelectorAll('div[data-pagelet]').forEach(pagelet => {
        const text = pagelet.textContent.toLowerCase();
        // Be more specific - look for exact "reels" match near the beginning
        if (text.includes('reels') && text.indexOf('reels') < 100) {
            // Additional safety check
            if (pagelet.offsetHeight < 800 && !pagelet.querySelector('[role="main"]')) {
                pagelet.style.display = 'none';
                console.log('Hidden Reels pagelet:', pagelet);
            }
        }
    });
    
    // Method 2: Look for "Reels" text with safer traversal
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
        const text = textNode.textContent.trim().toLowerCase();
        if (text === 'reels') { // Exact match only
            let container = textNode.parentElement;
            for (let i = 0; i < 8; i++) { // Reduced traversal depth
                if (!container) break;
                
                // Safety checks to avoid hiding main containers
                if (container.getAttribute('role') === 'main' || 
                    container.id === 'content' ||
                    container.offsetHeight > 1000) {
                    break;
                }
                
                // Look for appropriate container
                if (
                    container.getAttribute('data-pagelet') ||
                    (container.tagName === 'DIV' && container.children.length > 1 && 
                     container.offsetHeight > 100 && container.offsetHeight < 600)
                ) {
                    container.style.display = 'none';
                    console.log('Hidden Reels container:', container);
                    break;
                }
                container = container.parentElement;
            }
        }
    }
}

// Hide sponsored content
function hideSponsoredContent() {
    if (!settings.hideSponsored) return;
    
    // Find all text nodes containing "Sponsored"
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
        const text = textNode.textContent.trim();
        if (text === 'Sponsored' || text === 'Promoted' || text === 'Ad') {
            // Find the post container by going up the DOM
            let container = textNode.parentElement;
            for (let i = 0; i < 12; i++) {
                if (!container) break;
                
                // Safety check: don't hide main containers
                if (container.getAttribute('role') === 'main' || 
                    container.id === 'content') {
                    break;
                }
                
                // Look for post containers
                if (
                    container.dataset.pagelet ||
                    container.getAttribute('role') === 'article' ||
                    container.getAttribute('data-ft') ||
                    container.querySelector('[data-testid]') ||
                    (container.tagName === 'DIV' && container.offsetHeight > 100 && container.offsetHeight < 1000)
                ) {
                    container.style.display = 'none';
                    console.log('Hidden sponsored content:', container);
                    break;
                }
                container = container.parentElement;
            }
        }
    }
}

// Hide sections based on settings
function hideFacebookNoise() {
    if (settings.hidePeopleYouMayKnow) {
        hideSectionByHeader('People you may know');
    }
    if (settings.hideReels) {
        hideSectionByHeader('Reels');
        hideReels(); // Additional Reels hiding
    }
    if (settings.hideSponsored) {
        hideSponsoredContent();
    }
}

// Initialize extension and load settings
loadSettings();

// Run on DOM changes
const observer = new MutationObserver(() => {
    if (settings.hidePeopleYouMayKnow || settings.hideReels || settings.hideSponsored) {
        hideFacebookNoise();
    }
});
observer.observe(document.body, {childList: true, subtree: true});
