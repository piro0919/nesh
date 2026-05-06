import { Code, H1, Table } from "../_components/primitives";

export const metadata = { title: "SDK reference — Nesh docs" };

export default function Page() {
  return (
    <>
      <H1>SDK reference</H1>
      <h2 className="text-lg font-medium">
        <Code>usePush</Code>
      </h2>
      <p>Returns subscription helpers and reactive state.</p>
      <Table
        rows={[
          [
            "apiBase",
            "string",
            "Full URL of the project's API base. Use the value shown in the SDK setup card.",
          ],
          ["vapidPublicKey", "string", "Project VAPID public key."],
          [
            "userId",
            "string?",
            "Optional — your application user id. Lets the dashboard / REST API target sends to specific users.",
          ],
          ["swPath", "string?", "Defaults to /sw.js."],
          [
            "swScope",
            "string?",
            'Override the SW registration scope (e.g. "/" when serving from a sub-path).',
          ],
        ]}
      />
      <p>
        Returned: <Code>subscribe()</Code>, <Code>unsubscribe()</Code>, <Code>subscription</Code>,{" "}
        <Code>permission</Code>, <Code>isSupported</Code>, <Code>isSubscribing</Code>,{" "}
        <Code>error</Code>.
      </p>
    </>
  );
}
