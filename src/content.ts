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

        chrome.runtime.sendMessage({ professorName: professorName }, (response) => {
            // response is undefined if the service worker died or the port
            // closed before replying; reading .rating would throw.
            if (chrome.runtime.lastError || response?.rating == null) {
                badge.remove();
                return;
            }

            badge.textContent = ` ${response.rating} ★`;
        });
    });
}

const observer = new MutationObserver(() => addBadges());
observer.observe(document.body, { childList: true, subtree: true });

addBadges();