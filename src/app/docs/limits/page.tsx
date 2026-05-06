import Link from "next/link";
import { Code, H1, Table } from "../_components/primitives";

export const metadata = { title: "Free-tier limits — Nesh docs" };

export default function Page() {
  return (
    <>
      <H1>Free-tier limits</H1>
      <Table
        rows={[
          ["Projects per user", "1"],
          ["Subscribers per project", "5,000"],
          ["Sends per project per UTC month", "10,000"],
          ["Webhook delivery timeout", "5 s"],
          ["Subscribe / unsubscribe rate limit", "60 / min per IP × project × action"],
          ["Event tracking rate limit", "600 / min per IP × project"],
        ]}
      />
      <p>
        Hard caps return <Code>403</Code> (subscribers) or <Code>429</Code> (sends).{" "}
        <Link href="/" className="underline-offset-2 hover:underline">
          More on the FAQ
        </Link>
        .
      </p>
    </>
  );
}
