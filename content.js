// Settings management
const settings = {
    hidePeopleYouMayKnow: true,
    hideReels: true,
    hideFriendRequests: false,
    hideBirthdays: false,
    hideContacts: false
};

// Load settings from chrome extension storage
function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['hidePeopleYouMayKnow', 'hideReels', 'hideFriendRequests', 'hideBirthdays', 'hideContacts'], (result) => {
            settings.hidePeopleYouMayKnow = result.hidePeopleYouMayKnow !== undefined ? result.hidePeopleYouMayKnow : true;
            settings.hideReels = result.hideReels !== undefined ? result.hideReels : true;
            settings.hideFriendRequests = result.hideFriendRequests !== undefined ? result.hideFriendRequests : false;
            settings.hideBirthdays = result.hideBirthdays !== undefined ? result.hideBirthdays : false;
            settings.hideContacts = result.hideContacts !== undefined ? result.hideContacts : false;
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
    document.querySelectorAll('span, strong, h2, h3, h4, a, div').forEach(label => {
        if (label.innerText && label.innerText.trim().toLowerCase() === headerText.toLowerCase()) {
            // Go up DOM to find the card/container
            let container = label;
            for (let i = 0; i < 8; i++) { // Increased traversal depth
                container = container.parentElement;
                if (!container) break;
                
                // Safety check: don't hide main containers
                if (container.getAttribute('role') === 'main' || 
                    container.id === 'content' ||
                    container.tagName === 'BODY' ||
                    container.classList.contains('fb_content')) {
                    break;
                }
                
                // Make sure this container is specifically for this section
                const containerText = (container.innerText || container.textContent || '').toLowerCase();
                const isCorrectSection = containerText.includes(headerText.toLowerCase());
                
                // Look for boundaries: data-pagelet, role=region, or large divs
                if (isCorrectSection && (
                    container.dataset.pagelet ||
                    (container.getAttribute && container.getAttribute('role') === 'region') ||
                    (container.tagName === 'DIV' && container.childElementCount > 1 && 
                     container.offsetHeight > 50 && container.offsetHeight < 600)
                )) {
                    container.style.display = 'none';
                    console.log(`Hidden ${headerText} section by header:`, container);
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

// Enhanced function to hide Friend Requests section
function hideFriendRequestsSection() {
    if (!settings.hideFriendRequests) return;
    
    // Method 1: Find any element containing "Friend requests" text
    document.querySelectorAll('*').forEach(element => {
        const text = element.innerText || element.textContent || '';
        if (text.includes('Friend requests') || text.includes('friend requests')) {
            let container = element;
            // Try different traversal depths
            for (let i = 0; i < 8; i++) {
                if (!container || !container.parentElement) break;
                container = container.parentElement;
                
                // Safety checks
                if (container.getAttribute('role') === 'main' || 
                    container.id === 'content' ||
                    container.tagName === 'BODY' ||
                    container.classList.contains('fb_content')) {
                    break;
                }
                
                // Check if this container has the friend requests content
                const containerText = (container.innerText || container.textContent || '').toLowerCase();
                if (containerText.includes('friend request') && 
                    container.offsetHeight > 80 && 
                    container.offsetHeight < 500 &&
                    !containerText.includes('birthday')) {
                    container.style.display = 'none';
                    console.log('Hidden Friend Requests section:', container);
                    return;
                }
            }
        }
    });
    
    // Method 2: Look for common friend request patterns
    const friendRequestSelectors = [
        '[data-pagelet*="friend"]',
        '[data-testid*="friend"]',
        '[aria-label*="friend request"]',
        '[aria-label*="Friend request"]'
    ];
    
    friendRequestSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            if (element.offsetHeight > 50 && element.offsetHeight < 400) {
                element.style.display = 'none';
                console.log('Hidden Friend Requests by selector:', selector, element);
            }
        });
    });
}

// Enhanced function to hide Contacts section
function hideContactsSection() {
    if (!settings.hideContacts) return;
    
    // Method 1: Find any element containing "Contacts" text
    document.querySelectorAll('*').forEach(element => {
        const text = element.innerText || element.textContent || '';
        if (text.includes('Contacts') && text.length < 50) { // Short text to avoid hiding entire posts
            let container = element;
            // Try different traversal depths
            for (let i = 0; i < 8; i++) {
                if (!container || !container.parentElement) break;
                container = container.parentElement;
                
                // Safety checks
                if (container.getAttribute('role') === 'main' || 
                    container.id === 'content' ||
                    container.tagName === 'BODY' ||
                    container.classList.contains('fb_content')) {
                    break;
                }
                
                // Check if this container has contacts content
                const containerText = (container.innerText || container.textContent || '').toLowerCase();
                const hasContactImages = container.querySelectorAll('img, [role="img"]').length;
                
                if (containerText.includes('contacts') && 
                    container.offsetHeight > 100 && 
                    container.offsetHeight < 600 &&
                    hasContactImages > 1) {
                    container.style.display = 'none';
                    console.log('Hidden Contacts section:', container);
                    return;
                }
            }
        }
    });
    
    // Method 2: Look for contact-related selectors
    const contactSelectors = [
        '[data-pagelet*="contact"]',
        '[data-testid*="contact"]',
        '[aria-label*="contact"]',
        '[aria-label*="Contact"]',
        '[data-testid*="messenger"]'
    ];
    
    contactSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            // Check if it's a container with multiple contacts
            if (element.children.length > 2 && 
                element.offsetHeight > 100 && 
                element.offsetHeight < 500) {
                element.style.display = 'none';
                console.log('Hidden Contacts by selector:', selector, element);
            }
        });
    });
    
    // Method 3: Look for sidebar widgets with "See all" text and contact lists
    document.querySelectorAll('div').forEach(element => {
        const text = element.innerText || element.textContent || '';
        if (text.includes('Contacts') && 
            (text.includes('See all') || text.includes('Active')) &&
            element.querySelectorAll('img').length > 2) {
            if (element.offsetHeight > 150 && element.offsetHeight < 600) {
                element.style.display = 'none';
                console.log('Hidden Contacts sidebar widget:', element);
            }
        }
    });
}

// Hide sections based on settings
function hideFacebookNoise() {
    try {
        console.log('Facebook Cleaner: Starting to hide sections with settings:', settings);
        
        if (settings.hidePeopleYouMayKnow) {
            hideSectionByHeader('People you may know');
        }
        if (settings.hideReels) {
            hideSectionByHeader('Reels');
            hideReels(); // Additional Reels hiding
        }
        if (settings.hideFriendRequests) {
            console.log('Facebook Cleaner: Attempting to hide Friend Requests');
            hideSectionByHeader('Friend requests');
            hideFriendRequestsSection(); // Enhanced friend requests hiding
        }
        if (settings.hideBirthdays) {
            hideSectionByHeader('Birthdays');
        }
        if (settings.hideContacts) {
            console.log('Facebook Cleaner: Attempting to hide Contacts');
            hideSectionByHeader('Contacts');
            hideContactsSection(); // Enhanced contacts hiding
        }
        
        console.log('Facebook Cleaner: Finished hiding sections');
    } catch (error) {
        console.error('Facebook Cleaner error:', error);
    }
}

// Initialize extension and load settings
loadSettings();

// Run immediately when page loads
setTimeout(() => {
    hideFacebookNoise();
}, 1000);

// Run on DOM changes with more aggressive monitoring
const observer = new MutationObserver(() => {
    if (settings.hidePeopleYouMayKnow || settings.hideReels || 
        settings.hideFriendRequests || settings.hideBirthdays || settings.hideContacts) {
        hideFacebookNoise();
    }
});
observer.observe(document.body, {childList: true, subtree: true});
