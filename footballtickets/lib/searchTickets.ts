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
  const childrenEligible = search.children.every(
    (age) => age <= match.ticketRules.juniorMaxAge
  );

  if (!childrenEligible) {
    return {
      ...match,
      totalPrice: null,
      eligible: true,
      reason:
        "One or more children are above Fulham's Junior U18 age limit, so adult pricing may apply.",
    };
  }

  if (match.adultPrice === null || match.junior?.price === null) {
    return {
      ...match,
      totalPrice: null,
      eligible: true,
      reason:
        "Fixture found. Fulham supports Junior U18 tickets, but exact live pricing is not exposed on the current public fixture page yet.",
    };
  }

  let totalPrice = match.adultPrice * search.adults;

  for (const childAge of search.children) {
    totalPrice +=
      childAge <= match.junior.maxAge ? match.junior.price : match.adultPrice;
  }

  return {
    ...match,
    totalPrice,
    eligible: totalPrice <= search.maxBudget,
  };
}
