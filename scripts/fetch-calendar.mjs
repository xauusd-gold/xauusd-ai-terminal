import fs from "node:fs/promises";

const feeds = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json"
];

async function getJson(url) {
  for (let i = 1; i <= 3; i++) {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*",
        "Referer": "https://www.forexfactory.com/",
        "Origin": "https://www.forexfactory.com"
      },
      redirect: "follow"
    });

    if (r.ok) return await r.json();

    console.log(`${url} -> ${r.status}`);

    if (i === 3) {
      const body = await r.text();
      throw new Error(
        `Calendar feed returned ${r.status}\n${body.substring(0,500)}`
      );
    }

    await new Promise(r => setTimeout(r, 2000));
  }
}

const relevant =
/fed|fomc|interest rate|inflation|cpi|pce|payroll|employment|unemployment|jobless|gdp|pmi|ism|retail sales|consumer confidence|jolts|durable goods|powell|treasury/i;

const importance = {
  Low: 1,
  Medium: 2,
  High: 3
};

const batches = await Promise.all(
  feeds.map(getJson)
);

const fresh = batches
  .flat()
  .filter(
    e =>
      e.country === "USD" &&
      relevant.test(e.title || "")
  )
  .map(e => ({
    CalendarId: `ff-${e.date}-${e.title}`,
    Date: e.date,
    Country: "United States",
    Event: e.title,
    Category: e.title,
    Actual: e.actual || "",
    Forecast: e.forecast || "",
    Previous: e.previous || "",
    Importance: importance[e.impact] || 1,
    Source: "Forex Factory"
  }));

let old = [];

try {
  old = JSON.parse(
    await fs.readFile("data/calendar.json", "utf8")
  ).events || [];
} catch {}

const now = new Date();

const merged = new Map(
  old.map(e => [e.CalendarId, e])
);

for (const e of fresh)
  merged.set(e.CalendarId, e);

const events = [...merged.values()];

await fs.mkdir("data", { recursive: true });

await fs.writeFile(
  "data/calendar.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      events
    },
    null,
    2
  )
);

const key = process.env.TWELVE_DATA_API_KEY;

const price = await fetch(
  `https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${key}`
);

const market = await price.json();

await fs.writeFile(
  "data/market.json",
  JSON.stringify(market, null, 2)
);

console.log("Done");
