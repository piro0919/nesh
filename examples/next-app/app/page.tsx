"use client";

import { usePush } from "@piro0919/next-push";

const apiBase = process.env.NEXT_PUBLIC_NESH_API_BASE;
const vapidPublicKey = process.env.NEXT_PUBLIC_NESH_VAPID_PUBLIC_KEY;

export default function Page() {
  const { subscribe, unsubscribe, subscription, isSupported, permission, isSubscribing, error } =
    usePush({
      apiBase,
      vapidPublicKey,
    });

  if (!apiBase || !vapidPublicKey) {
    return (
      <Card>
        <h1>Setup needed</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code> and fill in
          <code>NEXT_PUBLIC_NESH_API_BASE</code> and{" "}
          <code>NEXT_PUBLIC_NESH_VAPID_PUBLIC_KEY</code> from your Nesh project's "SDK setup" card.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 style={{ margin: 0, fontSize: 28 }}>Nesh sample</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Subscribe this browser, then send a notification from the Nesh dashboard.
      </p>

      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px", margin: 0 }}>
        <Term>Supported</Term>
        <Def>{String(isSupported)}</Def>
        <Term>Permission</Term>
        <Def>{permission}</Def>
        <Term>Subscribed</Term>
        <Def>{subscription ? "yes" : "no"}</Def>
      </dl>

      {error ? <p style={{ color: "#b91c1c" }}>{error.message}</p> : null}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {subscription ? (
          <button type="button" onClick={() => unsubscribe()} style={btnStyle}>
            Unsubscribe
          </button>
        ) : (
          <button
            type="button"
            onClick={() => subscribe()}
            disabled={!isSupported || isSubscribing}
            style={{ ...btnStyle, background: "#111", color: "#fff" }}
          >
            {isSubscribing ? "Subscribing…" : "Enable notifications"}
          </button>
        )}
      </div>

      {subscription ? (
        <details style={{ fontSize: 12, color: "#666" }}>
          <summary>Subscription details</summary>
          <pre style={{ overflow: "auto", background: "#f3f3f3", padding: 12, borderRadius: 6 }}>
            {JSON.stringify(subscription, null, 2)}
          </pre>
        </details>
      ) : null}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        background: "white",
        padding: 32,
        borderRadius: 12,
        maxWidth: 520,
        width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {children}
    </main>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return <dt style={{ color: "#666", fontSize: 13 }}>{children}</dt>;
}

function Def({ children }: { children: React.ReactNode }) {
  return <dd style={{ margin: 0, fontSize: 13 }}>{children}</dd>;
}

const btnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontSize: 14,
};
