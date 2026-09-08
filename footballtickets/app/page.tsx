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
  totalPrice: number | null;
  membershipRequired: boolean | null;
  seatsTogetherKnown: boolean;
  officialUrl: string;
  source: string;
  checkedAt: string;
  reason?: string;
};

export default function Home() {
  const [adults, setAdults] = useState(1);
  const [childAge, setChildAge] = useState(12);
  const [maxBudget, setMaxBudget] = useState(100);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");

  async function searchTickets() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adults, children: [childAge], maxBudget }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.results || []);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Search failed");
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
            <input
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(Number(e.target.value))}
            />
          </label>

          <label>
            Maximum total budget (£)
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
            />
          </label>

          <button onClick={searchTickets} disabled={loading}>
            {loading ? "Searching Fulham…" : "Find tickets"}
          </button>
        </section>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <section>
          {results.map((result) => (
            <article
              key={result.id}
              style={{ background: "white", borderRadius: 16, padding: 24, marginTop: 16 }}
            >
              <h3>{result.homeTeam} vs {result.awayTeam}</h3>
              <p>
                {result.venue} ·{" "}
                {new Date(result.kickoff).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Europe/London",
                })}
              </p>

              <p>
                Ticket status: <strong>{result.availability}</strong>
              </p>

              {result.totalPrice === null ? (
                <p>
                  Pricing not connected yet. We found this fixture from Fulham's official site.
                </p>
              ) : (
                <strong>Total: £{result.totalPrice}</strong>
              )}

              {result.reason && <p>{result.reason}</p>}

              <small>
                Source: {result.source} · checked{" "}
                {new Date(result.checkedAt).toLocaleTimeString("en-GB")}
              </small>

              <div>
                <a href={result.officialUrl} target="_blank" rel="noreferrer">
                  View official Fulham fixture page
                </a>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
