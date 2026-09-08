import { getFulhamMatches, TicketOption } from "./clubs/fulham";

export type TicketSearch = {
  adults: number;
  children: number[];
  maxBudget: number;
};

export type SearchResult = TicketOption & {
  totalPrice: number;
  eligible: boolean;
  reason?: string;
};

export function searchTickets(search: TicketSearch): SearchResult[] {
  return getFulhamMatches()
    .map((match) => calculatePrice(match, search))
    .filter((result) => result.eligible)
    .filter((result) => result.totalPrice <= search.maxBudget);
}

function calculatePrice(match: TicketOption, search: TicketSearch): SearchResult {
  if (match.adultPrice === null) {
    return { ...match, totalPrice: 0, eligible: false, reason: "Adult price unavailable" };
  }

  let totalPrice = match.adultPrice * search.adults;

  for (const childAge of search.children) {
    if (!match.junior) {
      return { ...match, totalPrice, eligible: false, reason: "Junior tickets unavailable" };
    }
    totalPrice += childAge <= match.junior.maxAge ? match.junior.price : match.adultPrice;
  }

  return { ...match, totalPrice, eligible: true };
}
