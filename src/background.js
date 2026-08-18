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

function namesMatch(professorName, candidate) {
  const parts = professorName.trim().toLowerCase().split(/\s+/);
  const queryFirst = parts[0];
  const queryLast = parts[parts.length - 1];

  const first = (candidate.firstName || "").trim().toLowerCase();
  const last = (candidate.lastName || "").trim().toLowerCase();

  // last name has to match and compare only the final word so a middle name/initial
  // doesnt break a good match
  if (queryLast !== last.split(/\s+/).pop()) return false;

  if (queryFirst === first) return true;

  // accepting when a first name is a prefix of the other
  // ex: "dan" vs "daniel"
  const shorter = queryFirst.length < first.length ? queryFirst : first;
  const longer = queryFirst.length < first.length ? first : queryFirst;
  return shorter.length >= 3 && longer.startsWith(shorter);
}

function pickBestMatch(candidates, professorName) {
  const matches = candidates.filter(c => 
    c.school?.name === CSULB_SCHOOL_NAME && namesMatch(professorName, c)
  );

  if (!matches.length) return null;

  // RMP has duplicate pages for some professors. an example i found on csulb's website
  // was "Xiaolong Wu" with 2 ratings and "Xiaolong WU" with 41. 
  // going to make the "busier" page the real one. AKA whichever one has more ratings
  return matches.reduce((best, c) => (c.numRatings > best.numRatings ? c : best));
}

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

  return pickBestMatch(candidates, professorName);
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
