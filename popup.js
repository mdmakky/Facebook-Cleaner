// Load current settings and update UI
document.addEventListener('DOMContentLoaded', function() {
    // Load settings from storage
    chrome.storage.sync.get(['hidePeopleYouMayKnow', 'hideReels', 'hideFriendRequests', 'hideBirthdays', 'hideContacts', 'hideLeftSidebar', 'hideWatch', 'hideMarketplace', 'hideGroups', 'hideGaming'], function(result) {
        document.getElementById('hidePeopleYouMayKnow').checked = result.hidePeopleYouMayKnow !== false;
        document.getElementById('hideReels').checked = result.hideReels !== false;
        document.getElementById('hideFriendRequests').checked = result.hideFriendRequests === true;
        document.getElementById('hideBirthdays').checked = result.hideBirthdays === true;
        document.getElementById('hideContacts').checked = result.hideContacts === true;
        document.getElementById('hideLeftSidebar').checked = result.hideLeftSidebar !== false;
        document.getElementById('hideWatch').checked = result.hideWatch === true;
        document.getElementById('hideMarketplace').checked = result.hideMarketplace === true;
        document.getElementById('hideGroups').checked = result.hideGroups === true;
        document.getElementById('hideGaming').checked = result.hideGaming === true;
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
    const checkboxes = ['hidePeopleYouMayKnow', 'hideReels', 'hideFriendRequests', 'hideBirthdays', 'hideContacts', 'hideLeftSidebar', 'hideWatch', 'hideMarketplace', 'hideGroups', 'hideGaming'];
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
        hideFriendRequests: document.getElementById('hideFriendRequests').checked,
        hideBirthdays: document.getElementById('hideBirthdays').checked,
        hideContacts: document.getElementById('hideContacts').checked,
        hideLeftSidebar: document.getElementById('hideLeftSidebar').checked,
        hideWatch: document.getElementById('hideWatch').checked,
        hideMarketplace: document.getElementById('hideMarketplace').checked,
        hideGroups: document.getElementById('hideGroups').checked,
        hideGaming: document.getElementById('hideGaming').checked
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
