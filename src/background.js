import { RateMyProfessor } from "rate-my-professor-api-ts";

// Hardcoding CSULB's RMP school ID since it never changes and looking it up
// was costing a lot of time and requests. 
const CSULB_SCHOOL_ID = "U2Nob29sLTE4ODQ2";
const CSULB_SCHOOL_NAME = "California State University Long Beach";
const API_LINK = "https://www.ratemyprofessors.com/graphql";

const HEADERS = {
  "Content-Type": "application/json",
  // public credential RMP's site ships in its JS. base64 "test:test".
  // found this in features.js in node_modules
  Authorization: "Basic dGVzdDp0ZXN0",
};

// asking for the 8 closest name matches so i can pick the best one myself
const SEARCH_QUERY = `query TeacherSearch($query: TeacherSearchQuery!) {
  search: newSearch {
    teachers(query: $query, first: 8) {
      edges {
        node {
          firstName
          lastName
          department
          avgRating
          avgDifficulty
          numRatings
          wouldTakeAgainPercent
          school { name }
        }
      }
    }
  }
}`;

async function lookupProfessor(professorName) {
  const response = await fetch(API_LINK, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: {
        query: {
          text: professorName,
          schoolID: CSULB_SCHOOL_ID,
          fallback: false,
          departmentID: null,
        },
      },
    }),
  });

  if (!response.ok) throw new Error(`RMP responded ${response.status} ${response.statusText}`);

  const data = await response.json();

  // unwrap edges/node into a simple array of professor info objects
  const candidates = data.data.search.teachers.edges.map(e => e.node);

  // temporary: see what api is returning

  console.log(`[${professorName}] ${candidates.length} candidates:`);
  candidates.forEach((c, i) => {
    console.log(`  [${i}] ${c.firstName} ${c.lastName} (${c.department}) 
      - ${c.avgRating}, ${c.numRatings} ratings, ${c.wouldTakeAgainPercent}% would take again, 
      difficulty ${c.avgDifficulty}/5, ${c.department} @ ${c.school.name}`);
  });

  // still taking first result like the library did
  // changing this later
  return candidates[0] ?? null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      const info = await lookupProfessor(request.professorName);
      if (!info || !info.numRatings) {
        sendResponse({ info: null });
        return;
      }
      sendResponse({ info });
    } catch (err) {
      console.error("lookup failed:", request.professorName, err);
      sendResponse({ info: null });
    }
  })();
  return true;
});
