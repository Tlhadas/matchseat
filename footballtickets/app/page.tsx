"use client";

import { useState } from "react";

type SearchResult = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  kickoff: string;
  availability: string;
  adultPrice: number | null;
  junior: { category: string; maxAge: number; price: number } | null;
  totalPrice: number;
  membershipRequired: boolean;
  seatsTogetherKnown: boolean;
  officialUrl: string;
};

export default function Home() {
  const [adults, setAdults] = useState(1);
  const [childAge, setChildAge] = useState(12);
  const [maxBudget, setMaxBudget] = useState(100);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  async function searchTickets() {
    setLoading(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adults, children: [childAge], maxBudget }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1>⚽ MatchSeat</h1>
        <p>Find football tickets in London that you can actually buy.</p>

        <section style={{ background: "white", borderRadius: 16, padding: 24 }}>
          <label>
            Adults
            <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
              {[1,2,3,4].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>

          <label>
            Child age
            <input type="number" value={childAge} onChange={(e) => setChildAge(Number(e.target.value))} />
          </label>

          <label>
            Maximum total budget (£)
            <input type="number" value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))} />
          </label>

          <button onClick={searchTickets} disabled={loading}>
            {loading ? "Searching..." : "Find tickets"}
          </button>
        </section>

        <section>
          {results.map((result) => (
            <article key={result.id} style={{ background: "white", borderRadius: 16, padding: 24, marginTop: 16 }}>
              <h3>{result.homeTeam} vs {result.awayTeam}</h3>
              <p>{result.venue} · {result.kickoff}</p>
              <p>Adult: £{result.adultPrice ?? "N/A"}</p>
              <p>
                {result.junior
                  ? result.junior.category + ": £" + result.junior.price
                  : "Junior ticket unavailable"}
              </p>
              <strong>Total: £{result.totalPrice}</strong>
              <div>
                {result.membershipRequired ? "Membership required" : "No membership required"}
                {" · "}
                {result.seatsTogetherKnown ? "Seats-together information available" : "Seats-together availability unknown"}
              </div>
              <a href={result.officialUrl} target="_blank" rel="noreferrer">View official tickets</a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
