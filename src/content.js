// PeopleSoft renders instructors as "Last,First" (no space).
function normalizeName(raw) {
    const match = raw.match(/^([^,]+),\s*(.+)$/);
    return match ? `${match[2].trim()} ${match[1].trim()}` : raw;
}

// Clicking a second badge closes the first card, 
// and clicking anywhere else on the page closes any open card.
let openCard = null;
let openBadge = null;

function closeCard() {
    if (openCard) openCard.remove();
    if (openBadge) openBadge.classList.remove("pc-badge--open");
    openCard = null;
    openBadge = null;
}

document.addEventListener("click", closeCard);

function addBadges() {
    const names = document.querySelectorAll('span[id^="MTG_INSTR"]');

    names.forEach(span => {

        const professorName = span.textContent.trim();

        // For any classes with no specified instructor yet, skip it.
        if (professorName === "To be Announced") return;

        // For classes w/ a specified instructor AND already have a badge, skip it.
        if (span.dataset.bvDone) return;

        // Once adding a badge, mark as done so this process isn't repeated.
        span.dataset.bvDone = "1";

        // placeholder for where the professor info lives
        let profInfo = null;

        const badge = document.createElement("span");
        badge.className = "pc-badge pc-badge--loading";
        badge.textContent = "…";

        // omg why does the badge keep wrapping
        span.style.whiteSpace = "nowrap";
        span.appendChild(badge);


        /*
        ------------------------------------------
        click functionality for the badge
        ------------------------------------------
        */
        badge.addEventListener("click", (event) => {
            // PeopleSoft has its own click handlers on the table rows that we need to stop
            event.stopPropagation();

            // Clicking the badge whose card is already open just closes it.
            if (openBadge === badge) {
                closeCard();
                return;
            }

            closeCard(); // close whatever else was open
            if (!profInfo) return;

            const professorCard = document.createElement("div");
            professorCard.className = "pc-card";
            professorCard.textContent = normalizeName(professorName);

            // Clicks inside the card shouldn't dismiss it.
            professorCard.addEventListener("click", (e) => e.stopPropagation());

            // Attach to body so no PeopleSoft container can mess with it
            document.body.appendChild(professorCard);
            const rect = badge.getBoundingClientRect();
            const maxLeft = window.scrollX + document.documentElement.clientWidth - 320 - 8;

            professorCard.style.top = `${rect.bottom + window.scrollY + 6}px`;
            professorCard.style.left = `${Math.min(rect.left + window.scrollX, maxLeft)}px`;

            openCard = professorCard;
            openBadge = badge;
            badge.classList.add("pc-badge--open");
        });

        chrome.runtime.sendMessage({ professorName: normalizeName(professorName) }, (response) => {
            if (chrome.runtime.lastError || response?.info?.avgRating == null) {
                // No RMP entry is greyed out so it's easy to tell.
                badge.className = "pc-badge pc-badge--empty";
                badge.textContent = "—";
                badge.title = "No Rate My Professor ratings found";
                return;
            }

            profInfo = response.info;

            badge.className = "pc-badge";
            badge.textContent = `${Number(profInfo.avgRating).toFixed(1)} ⭐`;
        });
    });
};



// The extension's own DOM changes count as mutations, so we need to debounce the logic for adding badges
let pendingScan = null;
const observer = new MutationObserver(() => {
    if (pendingScan) return;
    pendingScan = setTimeout(() => {
        pendingScan = null;
        addBadges();
    }, 150);
});
observer.observe(document.body, { childList: true, subtree: true });

addBadges();
