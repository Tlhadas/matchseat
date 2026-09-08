export type TicketOption = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  kickoff: string;
  saleType: "GENERAL_SALE" | "MEMBERS" | "TICKET_EXCHANGE" | "NOT_ON_SALE";
  availability: "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "UNKNOWN";
  adultPrice: number | null;
  junior: { category: string; maxAge: number; price: number } | null;
  membershipRequired: boolean;
  seatsTogetherKnown: boolean;
  officialUrl: string;
};

const fulhamMatches: TicketOption[] = [
  {
    id: "fulham-example-1",
    homeTeam: "Fulham",
    awayTeam: "Example FC",
    venue: "Craven Cottage",
    kickoff: "Saturday 15:00",
    saleType: "GENERAL_SALE",
    availability: "AVAILABLE",
    adultPrice: 48,
    junior: { category: "Junior U18", maxAge: 17, price: 20 },
    membershipRequired: false,
    seatsTogetherKnown: true,
    officialUrl: "https://www.fulhamfc.com/tickets-and-hospitality/"
  }
];

export function getFulhamMatches(): TicketOption[] {
  return fulhamMatches;
}
