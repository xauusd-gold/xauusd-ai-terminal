const urls = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json"
];

for (const url of urls) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Calendar feed returned ${response.status}`);
  const data = await response.json();
  console.log(url, Array.isArray(data) ? `OK: ${data.length} records` : "INVALID: expected array");
}
