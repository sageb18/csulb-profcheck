// not part of the extension

const API_LINK = "https://www.ratemyprofessors.com/graphql";

const HEADERS = {
  "Content-Type": "application/json",
  Authorization: "Basic dGVzdDp0ZXN0", 
};

const SCHOOL_SEARCH_QUERY = `query NewSearchSchoolsQuery($query: SchoolSearchQuery!) {
  newSearch {
    schools(query: $query) {
      edges {
        node { id name city state }
      }
    }
  }
}`;

async function findSchoolId(searchText) {
  const response = await fetch(API_LINK, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      query: SCHOOL_SEARCH_QUERY,
      variables: { query: { text: searchText } },
    }),
  });

  if (!response.ok) throw new Error(`RMP responded ${response.status} ${response.statusText}`);

  const data = await response.json();
  return data.data.newSearch.schools.edges.map(e => e.node);
}

const searchText = process.argv[2];

findSchoolId(searchText).then(schools => {
  console.table(schools);
});