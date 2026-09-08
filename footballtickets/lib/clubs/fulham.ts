export type TicketOption = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  kickoff: string;
  saleType: "GENERAL_SALE" | "MEMBERS" | "TICKET_EXCHANGE" | "NOT_ON_SALE" | "UNKNOWN";
  availability: "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "UNKNOWN";
  adultPrice: number | null;
  junior: { category: string; maxAge: number; price: number } | null;
  membershipRequired: boolean | null;
  seatsTogetherKnown: boolean;
  officialUrl: string;
  source: string;
  checkedAt: string;
};

type FulhamFixture = {
  id: string;
  opponent: string;
  venue: string;
  kickoff: string;
  officialUrl: string;
};

const FULHAM_FIXTURES_URL = "https://www.fulhamfc.com/matches/Download";

function decodeHtml(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function buildIsoDate(day: number, monthName: string, time: string): string {
  const months: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  const now = new Date();
  let year = now.getUTCFullYear();
  const month = months[monthName];

  if (month < now.getUTCMonth() - 3) {
    year += 1;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(Date.UTC(year, month, day, hours, minutes));
  return date.toISOString();
}

function parseHomeFixturesFromText(text: string): FulhamFixture[] {
  const monthNames =
    "January|February|March|April|May|June|July|August|September|October|November|December";

  const pattern = new RegExp(
    `(${monthNames}).{0,120}?(\\d{2}:\\d{2})\\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\\s+(\\d{1,2})\\s+H\\s*ome.{0,120}?Fulham(?: FC)?.{0,80}?([A-Z][A-Za-z0-9&'. -]{2,50}?).{0,100}?Craven Cottage`,
    "gi"
  );

  const fixtures: FulhamFixture[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const [, month, time, dayRaw, opponentRaw] = match;
    const opponent = opponentRaw.replace(/\s+/g, " ").trim();

    if (!opponent || opponent.toLowerCase().startsWith("fulham")) {
      continue;
    }

    const kickoff = buildIsoDate(Number(dayRaw), month, time);
    const id = `fulham-${kickoff.slice(0, 10)}-${opponent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

    fixtures.push({
      id,
      opponent,
      venue: "Craven Cottage",
      kickoff,
      officialUrl: FULHAM_FIXTURES_URL,
    });
  }

  return fixtures;
}

export async function getFulhamMatches(): Promise<TicketOption[]> {
  const response = await fetch(FULHAM_FIXTURES_URL, {
    headers: {
      "User-Agent": "MatchSeat/0.1 (+https://github.com/Tlhadas/matchseat)",
      Accept: "text/html",
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Fulham fixture source returned ${response.status}`);
  }

  const html = await response.text();
  const text = htmlToText(html);
  const fixtures = parseHomeFixturesFromText(text);
  const checkedAt = new Date().toISOString();

  return fixtures
    .filter((fixture) => new Date(fixture.kickoff).getTime() > Date.now())
    .map((fixture) => ({
      id: fixture.id,
      homeTeam: "Fulham",
      awayTeam: fixture.opponent,
      venue: fixture.venue,
      kickoff: fixture.kickoff,
      saleType: "UNKNOWN",
      availability: "UNKNOWN",
      adultPrice: null,
      junior: null,
      membershipRequired: null,
      seatsTogetherKnown: false,
      officialUrl: fixture.officialUrl,
      source: "Fulham FC official fixtures",
      checkedAt,
    }));
}
