// Load current settings and update UI
document.addEventListener('DOMContentLoaded', function() {
    // Load settings from storage
    chrome.storage.sync.get(['hidePeopleYouMayKnow', 'hideReels', 'hideSponsored'], function(result) {
        document.getElementById('hidePeopleYouMayKnow').checked = result.hidePeopleYouMayKnow !== false;
        document.getElementById('hideReels').checked = result.hideReels !== false;
        document.getElementById('hideSponsored').checked = result.hideSponsored === true;
    });
    
    // Add click event listeners to all setting rows
    document.querySelectorAll('.setting').forEach(function(settingElement) {
        settingElement.addEventListener('click', function() {
            const settingId = this.getAttribute('data-setting');
            const checkbox = document.getElementById(settingId);
            checkbox.checked = !checkbox.checked;
            saveSettings();
        });
    });
    
    // Add change event listeners to checkboxes
    const checkboxes = ['hidePeopleYouMayKnow', 'hideReels', 'hideSponsored'];
    checkboxes.forEach(function(id) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                saveSettings();
            });
        }
    });
});

function saveSettings() {
    const settings = {
        hidePeopleYouMayKnow: document.getElementById('hidePeopleYouMayKnow').checked,
        hideReels: document.getElementById('hideReels').checked,
        hideSponsored: document.getElementById('hideSponsored').checked
    };
    
    // Save to storage
    chrome.storage.sync.set(settings, function() {
        showStatus();
        
        // Send message to content script to update settings
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs.length > 0 && tabs[0].url && tabs[0].url.includes('facebook.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateSettings',
                    settings: settings
                }, function(response) {
                    // Handle any errors silently
                    if (chrome.runtime.lastError) {
                        // Extension context invalidated or tab not ready - this is normal
                    }
                });
            }
        });
    });
}

function showStatus() {
    const status = document.getElementById('status');
    if (status) {
        status.classList.add('show');
        setTimeout(function() {
            status.classList.remove('show');
        }, 2000);
    }
}
