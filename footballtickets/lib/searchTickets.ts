import { getFulhamMatches, TicketOption } from "./clubs/fulham";

export type TicketSearch = {
  adults: number;
  children: number[];
  maxBudget: number;
};

export type SearchResult = TicketOption & {
  totalPrice: number | null;
  eligible: boolean;
  reason?: string;
};

export async function searchTickets(search: TicketSearch): Promise<SearchResult[]> {
  const matches = await getFulhamMatches();

  return matches.map((match) => calculatePrice(match, search));
}

function calculatePrice(match: TicketOption, search: TicketSearch): SearchResult {
  if (match.adultPrice === null) {
    return {
      ...match,
      totalPrice: null,
      eligible: true,
      reason: "Fixture found on Fulham's official site; ticket pricing is not connected yet.",
    };
  }

  let totalPrice = match.adultPrice * search.adults;

  for (const childAge of search.children) {
    if (!match.junior) {
      return {
        ...match,
        totalPrice,
        eligible: false,
        reason: "Junior tickets unavailable",
      };
    }

    totalPrice += childAge <= match.junior.maxAge
      ? match.junior.price
      : match.adultPrice;
  }

  return {
    ...match,
    totalPrice,
    eligible: totalPrice <= search.maxBudget,
  };
}
