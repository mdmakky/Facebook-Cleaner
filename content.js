// Settings management
const settings = {
    hidePeopleYouMayKnow: true,
    hideGroupSuggestions: true,
    hideReels: true,
    hideFriendRequests: false,
    hideBirthdays: false,
    hideContacts: false,
    hideLeftSidebar: true, // New setting for left sidebar cleanup
    hideWatch: false,      // Hide Watch from top navigation
    hideMarketplace: false, // Hide Marketplace from top navigation
    hideGroups: false,     // Hide Groups from top navigation
    hideGaming: false      // Hide Gaming from top navigation
};

// Flag to prevent simultaneous hiding operations (prevents white flashing)
let isHiding = false;

// Add CSS-based instant hiding for common patterns
function addInstantHideCSS() {
    const style = document.createElement('style');
    style.id = 'facebook-cleaner-instant-hide';
    style.textContent = `
        /* Instantly hide common elements while JS detection runs */
        [data-pagelet*="FeedUnit"]:has(*:contains("People you may know")) { opacity: 0 !important; transition: none !important; }
        [data-pagelet*="FeedUnit"]:has(*:contains("Groups you may join")) { opacity: 0 !important; transition: none !important; }
        [data-pagelet*="FeedUnit"]:has(*:contains("Reels")) { opacity: 0 !important; transition: none !important; }
        [data-pagelet*="FeedUnit"]:has(*:contains("Friend requests")) { opacity: 0 !important; transition: none !important; }
        [data-pagelet*="FeedUnit"]:has(*:contains("Birthdays")) { opacity: 0 !important; transition: none !important; }
        [data-pagelet*="FeedUnit"]:has(*:contains("Contacts")) { opacity: 0 !important; transition: none !important; }
        
        /* Top navigation instant hiding */
        nav a[aria-label*="Watch" i] { opacity: 0 !important; transition: none !important; }
        nav a[aria-label*="Marketplace" i] { opacity: 0 !important; transition: none !important; }
        nav a[aria-label*="Groups" i] { opacity: 0 !important; transition: none !important; }
        nav a[aria-label*="Gaming" i] { opacity: 0 !important; transition: none !important; }
        
        /* This will be refined by JS detection */
    `;
    document.head.appendChild(style);
}

// Add the instant CSS as soon as possible
if (document.head) {
    addInstantHideCSS();
} else {
    document.addEventListener('DOMContentLoaded', addInstantHideCSS);
}

// Add debug logging to check if script is running
console.log('Facebook Cleaner: Content script loaded successfully!');
console.log('Facebook Cleaner: Current URL:', window.location.href);
console.log('Facebook Cleaner: Document ready state:', document.readyState);

// Load settings from chrome extension storage
function loadSettings() {
    console.log('Facebook Cleaner: Loading settings...');
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        console.log('Facebook Cleaner: Chrome storage API available');
        chrome.storage.sync.get(['hidePeopleYouMayKnow', 'hideGroupSuggestions', 'hideReels', 'hideFriendRequests', 'hideBirthdays', 'hideContacts', 'hideLeftSidebar', 'hideWatch', 'hideMarketplace', 'hideGroups', 'hideGaming'], (result) => {
            console.log('Facebook Cleaner: Loaded settings from storage:', result);
            
            settings.hidePeopleYouMayKnow = result.hidePeopleYouMayKnow !== undefined ? result.hidePeopleYouMayKnow : true;
            settings.hideGroupSuggestions = result.hideGroupSuggestions !== undefined ? result.hideGroupSuggestions : true;
            settings.hideReels = result.hideReels !== undefined ? result.hideReels : true;
            settings.hideFriendRequests = result.hideFriendRequests !== undefined ? result.hideFriendRequests : false;
            settings.hideBirthdays = result.hideBirthdays !== undefined ? result.hideBirthdays : false;
            settings.hideContacts = result.hideContacts !== undefined ? result.hideContacts : false;
            settings.hideLeftSidebar = result.hideLeftSidebar !== undefined ? result.hideLeftSidebar : true;
            settings.hideWatch = result.hideWatch !== undefined ? result.hideWatch : false;
            settings.hideMarketplace = result.hideMarketplace !== undefined ? result.hideMarketplace : false;
            settings.hideGroups = result.hideGroups !== undefined ? result.hideGroups : false;
            settings.hideGaming = result.hideGaming !== undefined ? result.hideGaming : false;
            
            console.log('Facebook Cleaner: Final settings:', settings);
            
            // Run after settings are loaded
            setTimeout(() => {
                hideFacebookNoise();
            }, 100); // Reduced from 1000ms to 100ms for faster initial hiding
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
        }, 100); // Reduced delay for faster hiding
    }
}

// Listen for settings changes from extension popup/options
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateSettings') {
            // Prevent multiple rapid updates
            if (isHiding) {
                sendResponse({success: true});
                return;
            }
            
            Object.assign(settings, request.settings);
            // Show all hidden elements first
            showAllHiddenElements();
            // Apply new settings immediately
            handleImmediateHiding(request.settings);
            // Apply comprehensive settings with a small delay
            setTimeout(() => {
                hideFacebookNoise();
            }, 50); // Reduced from 200ms to 50ms for immediate response to settings changes
            sendResponse({success: true});
        }
    });
}

// Immediate hiding function for instant response to settings changes
function handleImmediateHiding(newSettings) {
    console.log('Facebook Cleaner: Applying immediate hiding...', newSettings);
    
    // Top navigation elements - hide immediately without delays
    if (newSettings.hideWatch) {
        hideTopNavElementImmediate('Watch');
    }
    if (newSettings.hideMarketplace) {
        hideTopNavElementImmediate('Marketplace');
    }
    if (newSettings.hideGroups) {
        hideTopNavElementImmediate('Groups');
    }
    if (newSettings.hideGaming) {
        hideTopNavElementImmediate('Gaming');
    }
    
    // Feed elements - hide immediately
    if (newSettings.hidePeopleYouMayKnow) {
        hideElementByTextImmediate('people you may know');
    }
    if (newSettings.hideGroupSuggestions) {
        hideElementByTextImmediate('groups you may join');
    }
    if (newSettings.hideReels) {
        hideElementByTextImmediate('reels');
    }
    if (newSettings.hideFriendRequests) {
        hideElementByTextImmediate('friend requests');
    }
    if (newSettings.hideBirthdays) {
        hideElementByTextImmediate('birthdays');
    }
    if (newSettings.hideContacts) {
        hideElementByTextImmediate('contacts');
    }
}

// Immediate top navigation hiding (bypasses all delays)
function hideTopNavElementImmediate(elementName) {
    console.log(`Facebook Cleaner: Immediate hide for top nav: ${elementName}`);
    
    // Multiple methods for immediate detection
    const selectors = [
        `a[aria-label*="${elementName}" i]`,
        `a[href*="${elementName.toLowerCase()}"]`,
        `div[role="navigation"] a[aria-label*="${elementName}" i]`,
        `nav a[aria-label*="${elementName}" i]`,
        `[role="navigation"] [role="tab"][aria-label*="${elementName}" i]`
    ];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < 100 && rect.left > 50) { // Top navigation area
                element.style.display = 'none !important';
                
                // Hide parent containers
                let parent = element.closest('li, [role="tab"], [role="menuitem"], div[role="button"]');
                if (parent) {
                    parent.style.display = 'none !important';
                }
            }
        });
    });
    
    // Text-based detection
    document.querySelectorAll('a, span, div').forEach(element => {
        if (element.textContent && element.textContent.trim().toLowerCase() === elementName.toLowerCase()) {
            const rect = element.getBoundingClientRect();
            if (rect.top < 100 && rect.left > 50 && rect.left < window.innerWidth - 50) {
                let clickableParent = element.closest('a, button, [role="button"], [role="tab"]');
                if (clickableParent) {
                    clickableParent.style.display = 'none !important';
                    let container = clickableParent.closest('li, [role="tab"], [role="menuitem"]');
                    if (container) {
                        container.style.display = 'none !important';
                    }
                }
            }
        }
    });
}

// Immediate element hiding by text content
function hideElementByTextImmediate(searchText) {
    console.log(`Facebook Cleaner: Immediate hide for: ${searchText}`);
    
    document.querySelectorAll('*').forEach(element => {
        const text = (element.innerText || element.textContent || '').toLowerCase();
        if (text.includes(searchText) && text.length < 150) {
            let container = element;
            for (let i = 0; i < 6; i++) {
                if (!container.parentElement) break;
                container = container.parentElement;
                
                // Stop at major containers
                if (container.getAttribute('role') === 'main' || 
                    container.id === 'content' ||
                    container.tagName === 'BODY') {
                    break;
                }
                
                // Found good container
                if (container.dataset.pagelet || 
                    (container.offsetHeight > 100 && container.offsetHeight < 600)) {
                    container.style.display = 'none !important';
                    console.log(`Facebook Cleaner: Immediate hide for ${searchText}:`, container);
                    break;
                }
            }
        }
    });
}

// Show all previously hidden elements
function showAllHiddenElements() {
    // Only show elements that were hidden by our extension
    document.querySelectorAll('[style*="display: none"]').forEach(element => {
        // Check if the element was likely hidden by our extension
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            element.style.display = '';
        }
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

// Function to hide Groups You May Join / Group Suggestions
function hideGroupSuggestions() {
    if (!settings.hideGroupSuggestions) return;
    
    console.log('Facebook Cleaner: Hiding Groups You May Join...');
    
    // Method 1: Look for group suggestions by examining specific feed units
    document.querySelectorAll('div[data-pagelet]').forEach(pagelet => {
        const text = pagelet.textContent.toLowerCase();
        // Look for various group suggestion phrases
        if ((text.includes('groups you may join') || 
             text.includes('suggested groups') || 
             text.includes('join group') ||
             text.includes('groups for you')) && 
            text.indexOf('group') < 200) { // Must appear early in the text
            
            // Additional safety check
            if (pagelet.offsetHeight < 800 && !pagelet.querySelector('[role="main"]')) {
                pagelet.style.display = 'none';
                console.log('Hidden Groups suggestion pagelet:', pagelet);
            }
        }
    });
    
    // Method 2: Look for "Groups" text with group-specific containers
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
        const text = textNode.textContent.trim().toLowerCase();
        if (text.includes('groups you may join') || text.includes('suggested groups')) {
            let container = textNode.parentElement;
            for (let i = 0; i < 8; i++) {
                if (!container) break;
                
                // Safety checks to avoid hiding main containers
                if (container.getAttribute('role') === 'main' || 
                    container.id === 'content' ||
                    container.offsetHeight > 1000) {
                    break;
                }
                
                // Look for appropriate container with group suggestions
                const containerText = container.textContent.toLowerCase();
                if (containerText.includes('group') && 
                    (container.getAttribute('data-pagelet') ||
                     (container.tagName === 'DIV' && container.children.length > 1 && 
                      container.offsetHeight > 100 && container.offsetHeight < 600))) {
                    container.style.display = 'none';
                    console.log('Hidden Groups suggestion container:', container);
                    break;
                }
                container = container.parentElement;
            }
        }
    }
    
    // Method 3: Look for group-specific selectors
    const groupSelectors = [
        '[data-pagelet*="group"]',
        '[data-testid*="group"]',
        '[aria-label*="group suggestion"]',
        '[aria-label*="suggested group"]'
    ];
    
    groupSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            const text = element.textContent.toLowerCase();
            if (text.includes('join') || text.includes('suggest')) {
                if (element.offsetHeight > 50 && element.offsetHeight < 400) {
                    element.style.display = 'none';
                    console.log('Hidden Groups suggestion by selector:', selector, element);
                }
            }
        });
    });
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
    // Prevent simultaneous execution
    if (isHiding) {
        console.log('Facebook Cleaner: Already hiding elements, skipping...');
        return;
    }
    
    isHiding = true;
    
    try {
        console.log('Facebook Cleaner: Starting to hide sections with settings:', settings);
        console.log('Facebook Cleaner: Current page DOM elements count:', document.querySelectorAll('*').length);
        
        if (settings.hidePeopleYouMayKnow) {
            console.log('Facebook Cleaner: Attempting to hide People You May Know');
            hideSectionByHeader('People you may know');
        }
        if (settings.hideGroupSuggestions) {
            console.log('Facebook Cleaner: Attempting to hide Groups You May Join');
            hideSectionByHeader('Groups you may join');
            hideGroupSuggestions(); // Additional group suggestions hiding
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
        
        // Hide top navigation elements (except home)
        if (settings.hideWatch) {
            console.log('Facebook Cleaner: Attempting to hide Watch tab');
            hideTopNavElement('Watch');
        }
        if (settings.hideMarketplace) {
            console.log('Facebook Cleaner: Attempting to hide Marketplace tab');
            hideTopNavElement('Marketplace');
        }
        if (settings.hideGroups) {
            console.log('Facebook Cleaner: Attempting to hide Groups tab');
            hideTopNavElement('Groups');
        }
        if (settings.hideGaming) {
            console.log('Facebook Cleaner: Attempting to hide Gaming tab');
            hideTopNavElement('Gaming');
        }
        
        console.log('Facebook Cleaner: Finished hiding sections');
    } catch (error) {
        console.error('Facebook Cleaner error:', error);
    } finally {
        // Always reset the flag
        setTimeout(() => {
            isHiding = false;
        }, 500); // Release the lock after 500ms
    }
}

// Initialize extension and load settings
console.log('Facebook Cleaner: Initializing...');
loadSettings();

// Run immediately if document is already loaded (for fast hiding)
if (document.readyState !== 'loading') {
    console.log('Facebook Cleaner: Document ready, running immediate hide...');
    // Quick scan for obvious elements to hide immediately
    setTimeout(() => {
        quickHideCommonElements();
        hideFacebookNoise();
    }, 50); // Very quick initial run
}

// Quick function to hide common elements immediately
function quickHideCommonElements() {
    console.log('Facebook Cleaner: Quick hide for immediate response...');
    
    // Hide elements with obvious text content immediately
    const quickSelectors = [
        { text: 'people you may know', setting: 'hidePeopleYouMayKnow' },
        { text: 'groups you may join', setting: 'hideGroupSuggestions' },
        { text: 'reels', setting: 'hideReels' },
        { text: 'friend requests', setting: 'hideFriendRequests' },
        { text: 'birthdays', setting: 'hideBirthdays' },
        { text: 'contacts', setting: 'hideContacts' }
    ];
    
    quickSelectors.forEach(({ text, setting }) => {
        if (settings[setting]) {
            const elements = document.querySelectorAll('*');
            for (let element of elements) {
                const elementText = (element.innerText || '').toLowerCase();
                if (elementText.includes(text) && elementText.length < 100) {
                    let container = element;
                    for (let i = 0; i < 5; i++) {
                        if (!container.parentElement) break;
                        container = container.parentElement;
                        
                        if (container.offsetHeight > 100 && container.offsetHeight < 600) {
                            container.style.display = 'none';
                            console.log(`Facebook Cleaner: Quick hide for ${text}:`, container);
                            break;
                        }
                    }
                }
            }
        }
    });
    
    // Immediate top navigation hiding
    if (settings.hideWatch) {
        hideTopNavElementImmediate('Watch');
    }
    if (settings.hideMarketplace) {
        hideTopNavElementImmediate('Marketplace');
    }
    if (settings.hideGroups) {
        hideTopNavElementImmediate('Groups');
    }
    if (settings.hideGaming) {
        hideTopNavElementImmediate('Gaming');
    }
}

// Wait for page to be more fully loaded before running
function waitForPageLoad() {
    console.log('Facebook Cleaner: Waiting for page to load...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Facebook Cleaner: DOM Content Loaded');
            setTimeout(() => {
                hideFacebookNoise();
            }, 500); // Reduced from 2000ms to 500ms
        });
    } else {
        console.log('Facebook Cleaner: Document already loaded');
        setTimeout(() => {
            hideFacebookNoise();
        }, 300); // Reduced from 2000ms to 300ms for faster response
    }
}

// Run initialization
waitForPageLoad();

// Also run after a longer delay to catch dynamically loaded content
setTimeout(() => {
    console.log('Facebook Cleaner: Running delayed execution...');
    hideFacebookNoise();
}, 2000); // Reduced from 5000ms to 2000ms

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
    // Only process if we have settings that would hide something and not already processing
    if (!isHiding && (settings.hidePeopleYouMayKnow || settings.hideReels || 
        settings.hideFriendRequests || settings.hideBirthdays || 
        settings.hideContacts || settings.hideLeftSidebar ||
        settings.hideWatch || settings.hideMarketplace || settings.hideGroups || settings.hideGaming)) {
        
        // Throttle the calls to prevent excessive processing
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
            console.log('Facebook Cleaner: DOM changed, re-running hide functions...');
            hideFacebookNoise();
        }, 300); // Reduced from 1000ms to 300ms for faster response to DOM changes
    }
});

// Function to hide top navigation elements (except home)
function hideTopNavElement(elementName) {
    console.log(`Facebook Cleaner: Looking for top nav element: ${elementName}`);
    
    // Method 1: Look for navigation links by aria-label or text
    const navSelectors = [
        `a[aria-label*="${elementName}" i]`,
        `a[href*="${elementName.toLowerCase()}"]`,
        `div[role="navigation"] a[aria-label*="${elementName}" i]`,
        `nav a[aria-label*="${elementName}" i]`
    ];
    
    navSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // Check if this is in the top navigation (not sidebar)
            const rect = element.getBoundingClientRect();
            if (rect.top < 100 && rect.left > 100) { // Top area, not far left
                console.log(`Facebook Cleaner: Hiding top nav ${elementName} via selector:`, selector, element);
                element.style.display = 'none';
                
                // Also hide parent if it's a list item or navigation container
                let parent = element.parentElement;
                while (parent && parent.tagName && ['LI', 'DIV'].includes(parent.tagName.toUpperCase())) {
                    const parentRect = parent.getBoundingClientRect();
                    if (parentRect.width < 200 && parentRect.height < 100) { // Small container, likely a nav item
                        parent.style.display = 'none';
                        console.log(`Facebook Cleaner: Also hiding parent container for ${elementName}:`, parent);
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
        });
    });
    
    // Method 2: Look by text content in the top navigation area
    const textElements = document.querySelectorAll('a, span, div');
    textElements.forEach(element => {
        if (element.textContent && element.textContent.trim().toLowerCase() === elementName.toLowerCase()) {
            const rect = element.getBoundingClientRect();
            // Check if it's in the top navigation area
            if (rect.top < 100 && rect.left > 100 && rect.left < window.innerWidth - 100) {
                console.log(`Facebook Cleaner: Hiding top nav ${elementName} by text content:`, element);
                
                // Find the clickable parent (usually an 'a' tag or interactive div)
                let clickableParent = element;
                while (clickableParent && !['A', 'BUTTON'].includes(clickableParent.tagName)) {
                    clickableParent = clickableParent.parentElement;
                    if (!clickableParent) break;
                }
                
                if (clickableParent) {
                    clickableParent.style.display = 'none';
                    
                    // Also hide the list item container if exists
                    let listItem = clickableParent.closest('li, [role="tab"], [role="menuitem"]');
                    if (listItem) {
                        listItem.style.display = 'none';
                        console.log(`Facebook Cleaner: Also hiding list container for ${elementName}:`, listItem);
                    }
                }
            }
        }
    });
}

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
let periodicCheckInterval;
function startPeriodicCheck() {
    // Clear any existing interval
    if (periodicCheckInterval) {
        clearInterval(periodicCheckInterval);
    }
    
    periodicCheckInterval = setInterval(() => {
        // Only run if not currently hiding and if there are active settings
        if (!isHiding && (settings.hideLeftSidebar || settings.hidePeopleYouMayKnow || 
            settings.hideReels || settings.hideWatch || settings.hideMarketplace || 
            settings.hideGroups || settings.hideGaming)) {
            console.log('Facebook Cleaner: Periodic check...');
            hideFacebookNoise();
        }
    }, 5000); // Reduced from 10000ms to 5000ms for more frequent checks
}

// Start the periodic check
startPeriodicCheck();
