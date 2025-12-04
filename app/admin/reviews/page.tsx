// FILE: app/admin/reviews/page.tsx
import { adminDb } from "@/utils/firebaseAdmin";

type ReviewRow = {
  id: string;
  appName?: string;
  rating?: number | null;
  text?: string;
  email?: string;
  createdAt?: string | null;
};

export const dynamic = "force-dynamic"; // always fresh

async function getReviews(): Promise<ReviewRow[]> {
  if (!adminDb) {
    console.warn("adminDb not initialised – returning empty review list.");
    return [];
  }

  const snap = await adminDb
    .collection("reviews")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      appName: data.appName ?? "",
      rating: data.rating ?? null,
      text: data.text ?? "",
      email: data.email ?? "",
      createdAt: data.createdAt ?? "",
    };
  });
}

export default async function ReviewsAdminPage() {
  const reviews = await getReviews();

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        CalmTinnitus – Reviews
      </h1>
      <p style={{ marginBottom: 24, color: "#9ca3af" }}>
        Showing the latest {reviews.length} reviews from Firestore.
      </p>

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            border: "1px solid #1f2937",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead style={{ backgroundColor: "#0b1120" }}>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>App</th>
                <th style={thStyle}>Rating</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Text</th>
                <th style={thStyle}>ID</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #111827" }}>
                  <td style={tdStyle}>{r.createdAt || ""}</td>
                  <td style={tdStyle}>{r.appName || ""}</td>
                  <td style={tdStyle}>{r.rating ?? ""}</td>
                  <td style={tdStyle}>{r.email || ""}</td>
                  <td style={{ ...tdStyle, maxWidth: 420 }}>{r.text || ""}</td>
                  <td style={{ ...tdStyle, fontSize: 11, color: "#6b7280" }}>
                    {r.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  fontSize: 13,
  color: "#9ca3af",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  verticalAlign: "top",
};
