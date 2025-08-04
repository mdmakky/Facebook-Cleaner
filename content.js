// Settings management
const settings = {
    hidePeopleYouMayKnow: true,
    hideReels: true,
    hideFriendRequests: false,
    hideBirthdays: false,
    hideContacts: false,
    hideLeftSidebar: true // New setting for left sidebar cleanup
};

// Add debug logging to check if script is running
console.log('Facebook Cleaner: Content script loaded successfully!');
console.log('Facebook Cleaner: Current URL:', window.location.href);
console.log('Facebook Cleaner: Document ready state:', document.readyState);

// Load settings from chrome extension storage
function loadSettings() {
    console.log('Facebook Cleaner: Loading settings...');
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        console.log('Facebook Cleaner: Chrome storage API available');
        chrome.storage.sync.get(['hidePeopleYouMayKnow', 'hideReels', 'hideFriendRequests', 'hideBirthdays', 'hideContacts', 'hideLeftSidebar'], (result) => {
            console.log('Facebook Cleaner: Loaded settings from storage:', result);
            
            settings.hidePeopleYouMayKnow = result.hidePeopleYouMayKnow !== undefined ? result.hidePeopleYouMayKnow : true;
            settings.hideReels = result.hideReels !== undefined ? result.hideReels : true;
            settings.hideFriendRequests = result.hideFriendRequests !== undefined ? result.hideFriendRequests : false;
            settings.hideBirthdays = result.hideBirthdays !== undefined ? result.hideBirthdays : false;
            settings.hideContacts = result.hideContacts !== undefined ? result.hideContacts : false;
            settings.hideLeftSidebar = result.hideLeftSidebar !== undefined ? result.hideLeftSidebar : true;
            
            console.log('Facebook Cleaner: Final settings:', settings);
            
            // Run after settings are loaded
            setTimeout(() => {
                hideFacebookNoise();
            }, 1000);
        });
    } else {
        console.log('Facebook Cleaner: Chrome storage API not available, using fallback');
        // Fallback to localStorage if chrome API not available
        const saved = localStorage.getItem('facebook-cleaner-settings');
        if (saved) {
            Object.assign(settings, JSON.parse(saved));
            console.log('Facebook Cleaner: Loaded settings from localStorage:', settings);
        } else {
            console.log('Facebook Cleaner: No saved settings, using defaults:', settings);
        }
        
        // Run after settings are loaded
        setTimeout(() => {
            hideFacebookNoise();
        }, 1000);
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
    console.log(`Facebook Cleaner: Looking for section with header: "${headerText}"`);
    
    // Search common header tags for the section label
    const elements = document.querySelectorAll('span, strong, h2, h3, h4, a, div');
    console.log(`Facebook Cleaner: Found ${elements.length} potential header elements`);
    
    let foundElements = 0;
    elements.forEach(label => {
        if (label.innerText && label.innerText.trim().toLowerCase() === headerText.toLowerCase()) {
            foundElements++;
            console.log(`Facebook Cleaner: Found matching header "${headerText}":`, label);
            
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
                    console.log(`Facebook Cleaner: Stopping traversal at safe container for ${headerText}`);
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
                    console.log(`Facebook Cleaner: Successfully hidden ${headerText} section:`, container);
                    break;
                }
            }
        }
    });
    
    console.log(`Facebook Cleaner: Found ${foundElements} matching elements for "${headerText}"`);
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

// Function to clean up left sidebar - keep only profile and shortcuts
function hideLeftSidebarSections() {
    if (!settings.hideLeftSidebar) return;
    
    console.log('Facebook Cleaner: Cleaning left sidebar...');
    
    // Method 0: Target specific left sidebar navigation by common patterns
    document.querySelectorAll('div[role="navigation"] a, nav a, div[data-pagelet*="left"] a').forEach(element => {
        const text = (element.innerText || element.textContent || '').toLowerCase().trim();
        const rect = element.getBoundingClientRect();
        
        // Skip if not in left sidebar area or too high (top nav)
        if (rect.left > window.innerWidth * 0.3 || rect.top < 120) {
            return;
        }
        
        // Items to definitely hide
        const shouldHide = [
            'groups', 'pages', 'marketplace', 'gaming', 'video', 'events', 
            'memories', 'saved', 'see more', 'climate science information hub',
            'ad preferences', 'fundraisers', 'recent ad activity', 'blood donations',
            'crisis response', 'community help', 'emotional health', 'favorites',
            'feeds', 'most recent', 'live videos'
        ].some(item => text.includes(item));
        
        // Items to preserve
        const shouldPreserve = [
            'md. arafatuzzaman', 'friends', 'home', 'shortcuts', 'your shortcuts'
        ].some(item => text.includes(item));
        
        if (shouldHide && !shouldPreserve && text.length > 2) {
            // Hide the parent container that includes the icon and text
            let container = element;
            for (let i = 0; i < 4; i++) {
                const parent = container.parentElement;
                if (!parent) break;
                
                // Don't go too high in the DOM
                if (parent.tagName === 'BODY' || 
                    parent.getAttribute('role') === 'main' ||
                    parent.getAttribute('role') === 'banner') {
                    break;
                }
                
                container = parent;
                
                // Stop if we find a good container
                if (container.offsetHeight > 30 && container.offsetHeight < 100) {
                    break;
                }
            }
            
            container.style.display = 'none';
            console.log(`Facebook Cleaner: Hidden left sidebar item: "${text}"`, container);
        }
    });
    
    // Method 1: More aggressive text-based hiding for left sidebar items
    const leftSidebarTextsToHide = [
        'Groups', 'Pages', 'Marketplace', 'Gaming', 'Video', 'Events', 
        'Memories', 'Saved', 'See more', 'See More', 'Climate Science Information Hub',
        'Ad preferences', 'Fundraisers', 'Recent ad activity', 'Blood donations',
        'Crisis response', 'Community help', 'Emotional health', 'Favorites',
        'Feeds', 'Most recent', 'Live videos', 'Messenger Kids'
    ];
    
    leftSidebarTextsToHide.forEach(targetText => {
        document.querySelectorAll('*').forEach(element => {
            const text = (element.innerText || element.textContent || '').trim();
            
            // Exact match or very close match
            if (text === targetText || text.toLowerCase() === targetText.toLowerCase()) {
                const rect = element.getBoundingClientRect();
                
                // Must be in left sidebar area and not in top navigation
                if (rect.left < window.innerWidth * 0.3 && rect.top > 120) {
                    // Find appropriate container to hide
                    let container = element;
                    for (let i = 0; i < 5; i++) {
                        const parent = container.parentElement;
                        if (!parent) break;
                        
                        // Safety checks
                        if (parent.tagName === 'BODY' || 
                            parent.getAttribute('role') === 'main') {
                            break;
                        }
                        
                        // Check if parent contains profile info or shortcuts
                        const parentText = (parent.innerText || parent.textContent || '').toLowerCase();
                        if (parentText.includes('md. arafatuzzaman') || 
                            parentText.includes('shortcuts') ||
                            parentText.includes('friends')) {
                            break;
                        }
                        
                        container = parent;
                        
                        // Good container size for a menu item
                        if (container.offsetHeight > 35 && container.offsetHeight < 120) {
                            break;
                        }
                    }
                    
                    container.style.display = 'none';
                    console.log(`Facebook Cleaner: Hidden "${targetText}" from left sidebar`, container);
                }
            }
        });
    });
    
    // Method 2: Target elements with specific Facebook data attributes in left sidebar
    const leftSidebarSelectors = [
        '[data-pagelet*="LeftRail"]',
        '[data-pagelet*="left_rail"]', 
        '[data-testid*="left_nav"]',
        '[data-testid*="sidebar"]'
    ];
    
    leftSidebarSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(sidebar => {
            // Look for navigation items within the left sidebar
            sidebar.querySelectorAll('a, div').forEach(item => {
                const text = (item.innerText || item.textContent || '').toLowerCase().trim();
                const hasIcon = item.querySelector('svg, img, i') !== null;
                
                // Target items that look like navigation menu items
                if (hasIcon && item.offsetHeight > 25 && item.offsetHeight < 100) {
                    const shouldHide = [
                        'groups', 'pages', 'marketplace', 'gaming', 'video', 'events',
                        'memories', 'saved', 'see more', 'climate science', 'ad preferences',
                        'fundraisers', 'blood donations', 'crisis response', 'community help'
                    ].some(keyword => text.includes(keyword));
                    
                    const shouldPreserve = [
                        'home', 'friends', 'shortcuts', 'md. arafatuzzaman'
                    ].some(keyword => text.includes(keyword));
                    
                    if (shouldHide && !shouldPreserve) {
                        item.style.display = 'none';
                        console.log(`Facebook Cleaner: Hidden sidebar item: "${text}"`, item);
                    }
                }
            });
        });
    });
    
    // Method 3: Use CSS-like targeting for specific left navigation structure
    setTimeout(() => {
        // Target the common left sidebar navigation structure
        const leftNavs = document.querySelectorAll('div[role="navigation"]');
        leftNavs.forEach(nav => {
            const rect = nav.getBoundingClientRect();
            
            // Must be on the left side and not the top navigation
            if (rect.left < 300 && rect.top > 100) {
                nav.querySelectorAll('a').forEach(link => {
                    const text = link.textContent.toLowerCase().trim();
                    
                    const itemsToHide = [
                        'groups', 'pages', 'marketplace', 'gaming', 'watch', 'video',
                        'events', 'memories', 'saved', 'see more', 'ad preferences'
                    ];
                    
                    const itemsToKeep = [
                        'home', 'friends', 'shortcuts', 'md. arafatuzzaman'
                    ];
                    
                    if (itemsToHide.some(item => text.includes(item)) && 
                        !itemsToKeep.some(item => text.includes(item))) {
                        
                        // Hide the parent container that includes icon and text
                        let container = link.closest('div[role="none"], li, div');
                        if (container && container !== nav) {
                            container.style.display = 'none';
                            console.log(`Facebook Cleaner: Hidden nav item: "${text}"`, container);
                        }
                    }
                });
            }
        });
    }, 1000);
}

// Hide sections based on settings
function hideFacebookNoise() {
    try {
        console.log('Facebook Cleaner: Starting to hide sections with settings:', settings);
        console.log('Facebook Cleaner: Current page DOM elements count:', document.querySelectorAll('*').length);
        
        if (settings.hidePeopleYouMayKnow) {
            console.log('Facebook Cleaner: Attempting to hide People You May Know');
            hideSectionByHeader('People you may know');
        }
        if (settings.hideReels) {
            console.log('Facebook Cleaner: Attempting to hide Reels');
            hideSectionByHeader('Reels');
            hideReels(); // Additional Reels hiding
        }
        if (settings.hideFriendRequests) {
            console.log('Facebook Cleaner: Attempting to hide Friend Requests');
            hideSectionByHeader('Friend requests');
            hideFriendRequestsSection(); // Enhanced friend requests hiding
        }
        if (settings.hideBirthdays) {
            console.log('Facebook Cleaner: Attempting to hide Birthdays');
            hideSectionByHeader('Birthdays');
        }
        if (settings.hideContacts) {
            console.log('Facebook Cleaner: Attempting to hide Contacts');
            hideSectionByHeader('Contacts');
            hideContactsSection(); // Enhanced contacts hiding
        }
        if (settings.hideLeftSidebar) {
            console.log('Facebook Cleaner: Attempting to clean left sidebar');
            hideLeftSidebarSections(); // Clean up left sidebar
        }
        
        console.log('Facebook Cleaner: Finished hiding sections');
    } catch (error) {
        console.error('Facebook Cleaner error:', error);
    }
}

// Initialize extension and load settings
console.log('Facebook Cleaner: Initializing...');
loadSettings();

// Wait for page to be more fully loaded before running
function waitForPageLoad() {
    console.log('Facebook Cleaner: Waiting for page to load...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Facebook Cleaner: DOM Content Loaded');
            setTimeout(() => {
                hideFacebookNoise();
            }, 2000);
        });
    } else {
        console.log('Facebook Cleaner: Document already loaded');
        setTimeout(() => {
            hideFacebookNoise();
        }, 2000);
    }
}

// Run initialization
waitForPageLoad();

// Also run after a longer delay to catch dynamically loaded content
setTimeout(() => {
    console.log('Facebook Cleaner: Running delayed execution...');
    hideFacebookNoise();
}, 5000);

// Add a global function for manual testing
window.testFacebookCleaner = function() {
    console.log('Facebook Cleaner: Manual test triggered');
    console.log('Facebook Cleaner: Current settings:', settings);
    hideFacebookNoise();
};

// Add a specific function to aggressively test left sidebar cleanup
window.testLeftSidebarCleanup = function() {
    console.log('Facebook Cleaner: Testing left sidebar cleanup specifically...');
    
    // Force enable left sidebar cleanup for testing
    const originalSetting = settings.hideLeftSidebar;
    settings.hideLeftSidebar = true;
    
    hideLeftSidebarSections();
    
    // Restore original setting
    settings.hideLeftSidebar = originalSetting;
    
    console.log('Facebook Cleaner: Left sidebar cleanup test completed');
};

// Add a function to check what elements are actually on the page
window.debugFacebookElements = function() {
    console.log('=== Facebook Elements Debug ===');
    console.log('Total elements:', document.querySelectorAll('*').length);
    
    // Check for common Facebook sections
    const sectionsToCheck = ['People you may know', 'Reels', 'Friend requests', 'Birthdays', 'Contacts'];
    
    sectionsToCheck.forEach(section => {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.innerText && el.innerText.toLowerCase().includes(section.toLowerCase())
        );
        console.log(`Elements containing "${section}":`, elements.length);
        if (elements.length > 0) {
            console.log(`Sample "${section}" elements:`, elements.slice(0, 3));
        }
    });
    
    console.log('Elements with data-pagelet:', document.querySelectorAll('[data-pagelet]').length);
    console.log('Elements with role="region":', document.querySelectorAll('[role="region"]').length);
    
    // Debug left sidebar specifically
    console.log('=== Left Sidebar Debug ===');
    const leftNavs = document.querySelectorAll('div[role="navigation"]');
    console.log('Navigation elements found:', leftNavs.length);
    
    leftNavs.forEach((nav, index) => {
        const rect = nav.getBoundingClientRect();
        console.log(`Nav ${index}: left=${rect.left}, top=${rect.top}, text="${nav.textContent.substring(0, 100)}"`);
        
        if (rect.left < 300 && rect.top > 100) {
            console.log(`  ^ This is likely a left sidebar navigation`);
            const links = nav.querySelectorAll('a');
            console.log(`  Links found: ${links.length}`);
            links.forEach((link, linkIndex) => {
                console.log(`    Link ${linkIndex}: "${link.textContent.trim()}"`);
            });
        }
    });
    
    console.log('=== End Debug ===');
};

console.log('Facebook Cleaner: Debug functions available:');
console.log('- window.testFacebookCleaner()');
console.log('- window.testLeftSidebarCleanup()'); 
console.log('- window.debugFacebookElements()');

// Run on DOM changes with throttling to prevent excessive calls
let observerTimeout;
const observer = new MutationObserver((mutations) => {
    // Only process if we have settings that would hide something
    if (settings.hidePeopleYouMayKnow || settings.hideReels || 
        settings.hideFriendRequests || settings.hideBirthdays || 
        settings.hideContacts || settings.hideLeftSidebar) {
        
        // Throttle the calls to prevent excessive processing
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
            console.log('Facebook Cleaner: DOM changed, re-running hide functions...');
            hideFacebookNoise();
        }, 500);
    }
});

// Start observing with more specific options
if (document.body) {
    observer.observe(document.body, {
        childList: true, 
        subtree: true,
        attributes: false // Don't watch attribute changes, only structure changes
    });
    console.log('Facebook Cleaner: MutationObserver started');
} else {
    console.log('Facebook Cleaner: Body not available yet, will start observer later');
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true, 
            subtree: true,
            attributes: false
        });
        console.log('Facebook Cleaner: MutationObserver started after DOMContentLoaded');
    });
}

// Additional periodic check with longer intervals to be less aggressive
setInterval(() => {
    if (settings.hideLeftSidebar || settings.hidePeopleYouMayKnow || settings.hideReels) {
        console.log('Facebook Cleaner: Periodic check...');
        hideFacebookNoise();
    }
}, 10000); // Check every 10 seconds instead of 2
