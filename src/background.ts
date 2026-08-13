import { RateMyProfessor } from "rate-my-professor-api-ts";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      const rmp = new RateMyProfessor("California State University Long Beach", request.professorName);
      const info = await rmp.get_professor_info();
      console.log("got:", info);

      if (typeof info?.avgRating !== "number") {
        console.warn("no rating for:", request.professorName, info);
        sendResponse({ rating: null });
        return;
      }

      sendResponse({ rating: info.avgRating });
    } catch (err) {
      console.error("lookup failed:", err);
      sendResponse({ rating: null });
    }
  })();
  return true;
});