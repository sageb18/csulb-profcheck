const hideUnratedCheckbox = document.getElementById('hide-unrated');

async function loadSettings() {
    const result = await chrome.storage.local.get('hide-unrated');

    // essentially: if hide-unrated is there, use whatever value it has. if its not there, just default to false (false = unchecked)
    hideUnratedCheckbox.checked = result["hide-unrated"] ?? false;
}

hideUnratedCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ 'hide-unrated': hideUnratedCheckbox.checked });
});

loadSettings();
