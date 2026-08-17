import { RateMyProfessor } from "rate-my-professor-api-ts";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      const rmp = new RateMyProfessor("California State University Long Beach", request.professorName);
      const info = await rmp.get_professor_info();
      console.log("got:", info);

      if (!info || !info.numRatings) {
        console.warn("no ratings for:", request.professorName, info);
        sendResponse({ info: null });
        return;
      }

      sendResponse({ info: info });
    } catch (err) {
      console.error("lookup failed:", err);
      sendResponse({ info: null });
    }
  })();
  return true;
});
