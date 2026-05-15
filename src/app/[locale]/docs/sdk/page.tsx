import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Code, H1, Table } from "../_components/primitives";

export async function generateMetadata() {
  const t = await getTranslations("docs.sdk");
  return { title: t("metaTitle") };
}

export default function Page() {
  const t = useTranslations("docs.sdk");
  return (
    <>
      <H1>{t("title")}</H1>
      <h2 className="text-lg font-medium">
        <Code>usePush</Code>
      </h2>
      <p>{t("intro")}</p>
      <Table
        rows={[
          ["apiBase", "string", t("rows.apiBase")],
          ["vapidPublicKey", "string", t("rows.vapidPublicKey")],
          ["userId", "string?", t("rows.userId")],
          ["swPath", "string?", t("rows.swPath")],
          ["swScope", "string?", t("rows.swScope")],
        ]}
      />
      <p>
        {t("returnedLead")}: <Code>subscribe()</Code>, <Code>unsubscribe()</Code>,{" "}
        <Code>subscription</Code>, <Code>permission</Code>, <Code>isSupported</Code>,{" "}
        <Code>isSubscribing</Code>, <Code>error</Code>.
      </p>
    </>
  );
}
