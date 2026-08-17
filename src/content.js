// PeopleSoft renders instructors as "Last,First" (no space).
function normalizeName(raw) {
    const match = raw.match(/^([^,]+),\s*(.+)$/);
    return match ? `${match[2].trim()} ${match[1].trim()}` : raw;
}

// Color of pill based on the star rating
function ratingClass(rating) {
    if (rating >= 4) return "pc-badge--good";
    if (rating >= 3) return "pc-badge--ok";
    return "pc-badge--poor";
}


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

        const badge = document.createElement("span");
        badge.className = "pc-badge pc-badge--loading";
        badge.textContent = "…";
        span.appendChild(badge);

        chrome.runtime.sendMessage({ professorName: normalizeName(professorName) }, (response) => {
            if (chrome.runtime.lastError || response?.info?.avgRating == null) {
                // No RMP entry is greyed out so it's easy to tell.
                badge.className = "pc-badge pc-badge--none";
                badge.textContent = "—";
                badge.title = "No Rate My Professor ratings found";
                return;
            }

            const profRating = response.info.avgRating;
            const diffRating = response.info.avgDifficulty;
            const department = response.info.department;
            const numRatings = response.info.numRatings;
            const wouldTakeAgainPercent = response.info.wouldTakeAgainPercent;

            // The pill itself stays short, just the two headline numbers.
            badge.className = "pc-badge " + ratingClass(profRating);
            badge.textContent = `${Number(profRating).toFixed(1)} ★  ${Number(diffRating).toFixed(1)} ⚡`;

            // Everything else goes in the hover tooltip for now. 
            // The next step moves this into a proper card you click open.
            const parts = [`${numRatings} ratings`];

            // RMP sends -1 when nobody answered the would take again question.
            if (wouldTakeAgainPercent >= 0) {
                parts.push(`${Math.round(wouldTakeAgainPercent)}% would take again`);
            }

            if (department) {
                parts.push(department);
            }

            badge.title = parts.join(" · ");

        });
    });
};


function onClick() {

    const professorCard = document.createElement("div");
    professorCard.className = "pc-card";
    professorCard.textContent = "Loading…";

    const badges = document.getElementsByClassName("pc-badge");
    for (const badge of badges) {
        badge.addEventListener("click", () => {
            document.body.appendChild(professorCard);
            professorCard.style.display = 'block';
        });
    }

}


const observer = new MutationObserver(() => addBadges());
observer.observe(document.body, { childList: true, subtree: true });

addBadges();
onClick();
