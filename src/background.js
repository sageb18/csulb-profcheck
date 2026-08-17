import { RateMyProfessor } from "rate-my-professor-api-ts";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      const rmp = new RateMyProfessor("California State University Long Beach", request.professorName);
      const info = await rmp.get_professor_info();
      console.log("got:", info);

      if (!info?.avgRating || !info?.avgDifficulty) {
        console.warn("no rating for:", request.professorName, info);
        sendResponse({ avgRating: null, avgDifficulty: null });
        return;
      }

      sendResponse({ avgRating: info.avgRating, avgDifficulty: info.avgDifficulty });
    } catch (err) {
      console.error("lookup failed:", err);
      sendResponse({ avgRating: null, avgDifficulty: null });
    }
  })();
  return true;
});
