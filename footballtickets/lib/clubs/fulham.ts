export type TicketOption = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  kickoff: string;
  saleType: "GENERAL_SALE" | "MEMBERS" | "TICKET_EXCHANGE" | "NOT_ON_SALE" | "UNKNOWN";
  availability: "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "UNKNOWN";
  adultPrice: number | null;
  junior: { category: string; maxAge: number; price: number | null } | null;
  membershipRequired: boolean | null;
  seatsTogetherKnown: boolean;
  officialUrl: string;
  source: string;
  checkedAt: string;
  ticketRules: {
    juniorCategory: string;
    juniorMaxAge: number;
    exchangeConcessionsAvailable: boolean;
    exchangePricingRule: string;
    generalSalePolicy: string;
  };
};

type FulhamFixture = {
  id: string;
  opponent: string;
  venue: string;
  kickoff: string;
  officialUrl: string;
};

const FULHAM_FIXTURES_URL = "https://hospitality.fulhamfc.com/upcoming-fixtures";
const FULHAM_TICKETS_URL = "https://www.eticketing.co.uk/fulhamfc";
const FULHAM_MATCH_TICKET_BASE =
  "https://www.fulhamfc.com/tickets-and-hospitality/match-tickets";

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
    January: 0, February: 1, March: 2, April: 3,
    May: 4, June: 5, July: 6, August: 7,
    September: 8, October: 9, November: 10, December: 11,
  };

  const now = new Date();
  let year = now.getUTCFullYear();
  const month = months[monthName];

  if (month < now.getUTCMonth() - 3) year += 1;

  const [hours, minutes] = time.split(":").map(Number);

  // Fulham publishes kick-off times in London local time. Work out the
  // London UTC offset for the fixture date so BST fixtures are not shifted.
  const naiveUtc = Date.UTC(year, month, day, hours, minutes);
  const zoneParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
  }).formatToParts(new Date(naiveUtc));

  const zoneName =
    zoneParts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const offsetMatch = zoneName.match(/GMT([+-])(\\d{1,2})(?::(\\d{2}))?/);
  const offsetMinutes = offsetMatch
    ? (offsetMatch[1] === "+" ? 1 : -1) *
      (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3] ?? 0))
    : 0;

  return new Date(naiveUtc - offsetMinutes * 60_000).toISOString();
}

function parseHomeFixturesFromText(text: string): FulhamFixture[] {
  const monthNumbers: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const pattern =
    /Fulham FC\s+Fulham FC\s+V\s+(.+?)\s+\1\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})\s+-\s+(\d{2}:\d{2})\s+Premier League/gi;

  const fixtures: FulhamFixture[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const [, opponentRaw, dayRaw, monthRaw, yearRaw, time] = match;
    const opponent = opponentRaw.replace(/\s+/g, " ").trim();
    const month = monthNumbers[monthRaw];
    const [hours, minutes] = time.split(":").map(Number);

    const naiveUtc = Date.UTC(Number(yearRaw), month, Number(dayRaw), hours, minutes);
    const zoneParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      timeZoneName: "shortOffset",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
    }).formatToParts(new Date(naiveUtc));

    const zoneName =
      zoneParts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
    const offsetMatch = zoneName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    const offsetMinutes = offsetMatch
      ? (offsetMatch[1] === "+" ? 1 : -1) *
        (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3] ?? 0))
      : 0;

    const kickoff = new Date(naiveUtc - offsetMinutes * 60_000).toISOString();
    const id = `fulham-${kickoff.slice(0, 10)}-${opponent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

    fixtures.push({
      id,
      opponent,
      venue: "Craven Cottage",
      kickoff,
      officialUrl: FULHAM_TICKETS_URL,
    });
  }

  return fixtures;
}

function opponentSlug(opponent: string): string {
  return opponent
    .toLowerCase()
    .replace(/\bafc\b/g, "")
    .replace(/\bfc\b/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getMatchPageDetails(fixture: FulhamFixture): Promise<{
  officialUrl: string;
  saleType: TicketOption["saleType"];
  availability: TicketOption["availability"];
  membershipRequired: boolean | null;
  source: string;
}> {
  const matchPageUrl =
    `${FULHAM_MATCH_TICKET_BASE}/fulham-v-${opponentSlug(fixture.opponent)}/`;

  try {
    const response = await fetch(matchPageUrl, {
      headers: {
        "User-Agent": "MatchSeat/0.1 (+https://github.com/Tlhadas/matchseat)",
        Accept: "text/html",
      },
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      throw new Error(`match page returned ${response.status}`);
    }

    const text = htmlToText(await response.text());
    const lower = text.toLowerCase();
    const expectedOpponent = fixture.opponent.toLowerCase().replace(/^afc\s+/, "");

    // Avoid treating a generic/redirected Fulham page as a fixture page.
    if (
      !lower.includes("fulham v") ||
      !lower.includes("craven cottage") ||
      !lower.includes(expectedOpponent)
    ) {
      throw new Error("match page could not be verified");
    }

    const soldOut =
      /(?:game|fixture|tickets?)\s+(?:has|have)\s+(?:now\s+)?sold\s+out/i.test(text) ||
      /sold\s+out!/i.test(text);
    const hasExchange = /ticket exchange/i.test(text);
    const hasGeneralSale = /tickets?\s+on\s+general\s+sale/i.test(text);
    const hasMemberWindow = /members?\*?\s*\(/i.test(text) || /202\d\/\d{2}\s+members/i.test(text);

    let saleType: TicketOption["saleType"] = "UNKNOWN";
    let availability: TicketOption["availability"] = "UNKNOWN";
    let membershipRequired: boolean | null = null;

    if (soldOut && hasExchange) {
      saleType = "TICKET_EXCHANGE";
      availability = "SOLD_OUT";
    } else if (soldOut) {
      saleType = "NOT_ON_SALE";
      availability = "SOLD_OUT";
    } else if (hasGeneralSale) {
      saleType = "GENERAL_SALE";
      availability = "AVAILABLE";
      membershipRequired = false;
    } else if (hasMemberWindow) {
      saleType = "MEMBERS";
      membershipRequired = null;
    }

    return {
      officialUrl: matchPageUrl,
      saleType,
      availability,
      membershipRequired,
      source: "Fulham FC official fixture and match-ticket pages",
    };
  } catch {
    return {
      officialUrl: FULHAM_TICKETS_URL,
      saleType: "UNKNOWN",
      availability: "UNKNOWN",
      membershipRequired: null,
      source: "Fulham FC official fixtures and ticketing guidance",
    };
  }
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
  const upcoming = fixtures.filter(
    (fixture) => new Date(fixture.kickoff).getTime() > Date.now()
  );

  const enriched = await Promise.all(
    upcoming.map(async (fixture) => {
      const matchPage = await getMatchPageDetails(fixture);

      return {
        id: fixture.id,
        homeTeam: "Fulham",
        awayTeam: fixture.opponent,
        venue: fixture.venue,
        kickoff: fixture.kickoff,
        saleType: matchPage.saleType,
        availability: matchPage.availability,
        adultPrice: null,
        junior: { category: "Junior U18", maxAge: 17, price: null },
        membershipRequired: matchPage.membershipRequired,
        seatsTogetherKnown: false,
        officialUrl: matchPage.officialUrl,
        source: matchPage.source,
        checkedAt,
        ticketRules: {
          juniorCategory: "Junior U18",
          juniorMaxAge: 17,
          exchangeConcessionsAvailable: false,
          exchangePricingRule:
            "Ticket Exchange seats are sold at the adult rate; concession pricing is not available.",
          generalSalePolicy:
            "General sale is fixture-specific and subject to remaining availability after priority sales.",
        },
      } satisfies TicketOption;
    })
  );

  return enriched;
}
