// hide unrated filter checkbox
const hideUnratedCheckbox = document.getElementById('hide-unrated');

// minimum rating filter checkbox and input
const minimumRatingCheckbox = document.getElementById('minimum-rating');
const minimumRatingValueInput = document.getElementById('minimum-rating-value');

async function loadSettings() {
    const result = await chrome.storage.local.get(['hide-unrated', 'minimum-rating', 'minimum-rating-value']);

    // if hide-unrated is there, use whatever value it has. if its not there, just default to false (false = unchecked)
    hideUnratedCheckbox.checked = result["hide-unrated"] ?? false;
    minimumRatingCheckbox.checked = result["minimum-rating"] ?? false;
    minimumRatingValueInput.value = result["minimum-rating-value"] ?? "";
}

hideUnratedCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ 'hide-unrated': hideUnratedCheckbox.checked });
});

minimumRatingCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ 'minimum-rating': minimumRatingCheckbox.checked })
})

minimumRatingValueInput.addEventListener('input', async () => {
    const value = parseFloat(minimumRatingValueInput.value);

    if (Number.isNaN(value)) {
        await chrome.storage.local.set({ 'minimum-rating-value': null })
    }

    else if (value < 0.5 || value > 5.0) {
        await chrome.storage.local.set({ 'minimum-rating-value': null })
    }
    else {
        await chrome.storage.local.set({ 'minimum-rating-value': value })
    }

})

loadSettings();


