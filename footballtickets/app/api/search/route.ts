import { searchTickets } from "@/lib/searchTickets";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const results = await searchTickets({
      adults: Number(body.adults || 1),
      children: Array.isArray(body.children) ? body.children.map(Number) : [],
      maxBudget: Number(body.maxBudget || 100),
    });

    return Response.json({
      query: body,
      results,
      source: "Fulham FC official fixtures",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Ticket search failed", error);

    return Response.json(
      {
        results: [],
        error: "Could not retrieve Fulham fixtures right now.",
      },
      { status: 502 }
    );
  }
}
