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

// Hide both sections
function hideFacebookNoise() {
    hideSectionByHeader('People you may know');
    hideSectionByHeader('Reels');
    hideReels(); // Additional Reels hiding
}

// Run on load and on DOM changes
hideFacebookNoise();
const observer = new MutationObserver(hideFacebookNoise);
observer.observe(document.body, {childList: true, subtree: true});
