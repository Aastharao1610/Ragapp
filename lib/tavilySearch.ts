export async function runTavilySearch(query: string) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVIY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      max_results: 5,
    }),
  });

  const data = await res.json();
  return data?.results || [];
}
