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
  const [maxBudget, setMaxBudget] = useState(120);
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
        body: JSON.stringify({
          adults,
          children: [childAge],
          maxBudget,
        }),
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
    <main className="site-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">MS</div>
          <div>
            <div className="brand-name">MatchSeat</div>
            <div className="brand-subtitle">Official football tickets, made simpler</div>
          </div>
        </div>
        <div className="official-pill">Official sources only</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">London football ticket finder</span>
          <h1>Find a match you can actually attend.</h1>
          <p>
            Search upcoming London fixtures by party size, child age and budget.
            We&apos;ll surface official ticket options and junior pricing where available.
          </p>
        </div>

        <div className="search-card">
          <div className="section-heading">
            <div>
              <span className="step">1</span>
              <h2>Tell us who&apos;s going</h2>
            </div>
            <span className="beta">Fulham beta</span>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Adults</span>
              <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Child age</span>
              <input
                type="number"
                min="0"
                max="17"
                value={childAge}
                onChange={(e) => setChildAge(Number(e.target.value))}
              />
              <small>We use age to match junior ticket categories.</small>
            </label>

            <label className="field field-wide">
              <span>Maximum total budget</span>
              <div className="money-input">
                <span>£</span>
                <input
                  type="number"
                  min="0"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                />
              </div>
            </label>
          </div>

          <div className="preferences">
            <label className="check-row">
              <input type="checkbox" defaultChecked />
              <span>
                <strong>Seats together</strong>
                <small>Prefer adjacent seats when we can confirm them</small>
              </span>
            </label>
            <label className="check-row">
              <input type="checkbox" defaultChecked disabled />
              <span>
                <strong>Official tickets only</strong>
                <small>No unofficial resale marketplaces</small>
              </span>
            </label>
          </div>

          <button className="primary-button" onClick={searchTickets} disabled={loading}>
            {loading ? "Searching Fulham…" : "Find matches"}
          </button>
        </div>
      </section>

      <section className="results-section">
        <div className="results-header">
          <div>
            <span className="step">2</span>
            <h2>Matches</h2>
          </div>
          <p>Live fixture data from official club sources.</p>
        </div>

        {error && <div className="error-card">{error}</div>}

        {!loading && !error && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⚽</div>
            <h3>Ready when you are</h3>
            <p>Choose your party and budget, then search for upcoming matches.</p>
          </div>
        )}

        <div className="results-list">
          {results.map((result) => {
            const statusLabel =
              result.availability === "AVAILABLE"
                ? "Tickets available"
                : result.availability === "LIMITED"
                  ? "Limited availability"
                  : result.availability === "SOLD_OUT"
                    ? "Sold out"
                    : "Availability being checked";

            return (
              <article className="match-card" key={result.id}>
                <div className="match-main">
                  <div className="match-meta">
                    <span className="competition">Premier League</span>
                    <span className="status">{statusLabel}</span>
                  </div>

                  <h3>
                    {result.homeTeam}
                    <span> vs </span>
                    {result.awayTeam}
                  </h3>

                  <div className="fixture-details">
                    <span>
                      {new Date(result.kickoff).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        timeZone: "Europe/London",
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(result.kickoff).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/London",
                      })}
                    </span>
                    <span>•</span>
                    <span>{result.venue}</span>
                  </div>

                  <div className="price-panel">
                    {result.totalPrice === null ? (
                      <>
                        <div>
                          <span className="price-label">Pricing</span>
                          <strong>Not connected yet</strong>
                        </div>
                        <p>
                          We found the fixture. Adult, junior and membership pricing
                          will appear here once the ticket layer is connected.
                        </p>
                      </>
                    ) : (
                      <div>
                        <span className="price-label">Party total</span>
                        <strong>£{result.totalPrice}</strong>
                      </div>
                    )}
                  </div>

                  {result.reason && <p className="reason">{result.reason}</p>}

                  <div className="trust-row">
                    <span>Official source</span>
                    <span>Checked {new Date(result.checkedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                <a
                  className="secondary-button"
                  href={result.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View official page
                </a>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
