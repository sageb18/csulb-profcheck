// PeopleSoft renders instructors as "Last,First" (no space).
function normalizeName(raw: string): string {
    const match = raw.match(/^([^,]+),\s*(.+)$/);
    return match ? `${match[2].trim()} ${match[1].trim()}` : raw;
}

function addBadges() {
    const names = document.querySelectorAll<HTMLSpanElement>('span[id^="MTG_INSTR"]');

    names.forEach(span => {

        const professorName = span.textContent.trim();

        // For any classes with no specified instructor yet, skip it.
        if (professorName === "To be Announced") return;

        // For classes w/ a specified instructor AND already have a badge, skip it.
        if (span.dataset.bvDone) return;

        // Once adding a badge, mark as done so this process isn't repeated.
        span.dataset.bvDone = "1";

        const badge = document.createElement("span");
        badge.textContent = " ...";
        badge.style.color = "#4a9d8f";
        badge.style.fontWeight = "500";
        span.appendChild(badge);

        chrome.runtime.sendMessage({ professorName: normalizeName(professorName) }, (response) => {
            if (chrome.runtime.lastError || response?.rating == null) {
                // No RMP entry is greyed out so it's easy to tell.
                badge.textContent = " —";
                badge.style.color = "#999";
                return;
            }

            badge.textContent = ` ${response.rating} ★`;
        });
    });
}

const observer = new MutationObserver(() => addBadges());
observer.observe(document.body, { childList: true, subtree: true });

addBadges();