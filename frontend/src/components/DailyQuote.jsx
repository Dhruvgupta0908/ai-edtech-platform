// frontend/src/components/DailyQuote.jsx
// Shows a different motivational quote each day based on date.
// Zero API calls — pure frontend.
// Usage: <DailyQuote /> anywhere in Dashboard.jsx

const QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Don't watch the clock; do what it does — keep going.", author: "Sam Levenson" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "GATE is not about memorising — it's about understanding.", author: "Every GATE topper" },
  { text: "One topic at a time. One day at a time.", author: "CoreMind AI" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Focus on progress, not perfection.", author: "Unknown" },
  { text: "Each concept you master is a step closer to your rank.", author: "CoreMind AI" },
  { text: "Consistency is more important than intensity.", author: "Unknown" },
  { text: "A little progress each day adds up to big results.", author: "Satya Nani" },
  { text: "Review yesterday's weak topics. They're tomorrow's strong ones.", author: "CoreMind AI" },
  { text: "The pain of studying is temporary. The regret of not studying is permanent.", author: "Unknown" },
  { text: "Your only competition is who you were yesterday.", author: "Unknown" },
  { text: "Every GATE question you solve is interest paid to your future self.", author: "CoreMind AI" },
  { text: "Understanding > Memorising. Always.", author: "CoreMind AI" },
  { text: "Data Structures, Algorithms, OS — one topic at a time.", author: "CoreMind AI" },
  { text: "The difference between ordinary and extraordinary is practice.", author: "Vladimir Horowitz" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "Study hard, for the well is deep and our brains are shallow.", author: "Richard Baxter" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The more you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Knowledge is power. Power to crack GATE.", author: "CoreMind AI" },
  { text: "Today's struggle is tomorrow's strength.", author: "CoreMind AI" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
];

export default function DailyQuote() {
  // Pick quote based on day of year — same quote all day, changes at midnight
  const dayOfYear = Math.floor(
    // eslint-disable-next-line react-hooks/purity
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const quote = QUOTES[dayOfYear % QUOTES.length];

  return (
    <div style={{
      background:   "linear-gradient(135deg, #6366f111, #8b5cf611)",
      border:       "1px solid #6366f133",
      borderLeft:   "4px solid #6366f1",
      borderRadius: "12px",
      padding:      "16px 20px",
      marginBottom: "28px",
      display:      "flex",
      alignItems:   "flex-start",
      gap:          "12px",
    }}>
      <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>💡</span>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "14px", color: "var(--text-primary)", fontStyle: "italic", lineHeight: 1.6 }}>
          "{quote.text}"
        </p>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
          — {quote.author}
        </p>
      </div>
    </div>
  );
}