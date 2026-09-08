import { searchTickets } from "@/lib/searchTickets";

export async function POST(request: Request) {
  const body = await request.json();

  const results = searchTickets({
    adults: Number(body.adults || 1),
    children: Array.isArray(body.children) ? body.children : [],
    maxBudget: Number(body.maxBudget || 100),
  });

  return Response.json({ query: body, results });
}
