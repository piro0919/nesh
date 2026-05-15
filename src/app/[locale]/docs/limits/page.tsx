import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Code, H1, Table } from "../_components/primitives";

export async function generateMetadata() {
  const t = await getTranslations("docs.limits");
  return { title: t("metaTitle") };
}

export default function Page() {
  const t = useTranslations("docs.limits");
  return (
    <>
      <H1>{t("title")}</H1>
      <Table
        rows={[
          [t("rows.projects"), "1"],
          [t("rows.subscribers"), "5,000"],
          [t("rows.sends"), "10,000"],
          [t("rows.webhookTimeout"), "5 s"],
          [t("rows.subRate"), "60 / min"],
          [t("rows.eventRate"), "600 / min"],
        ]}
      />
      <p>
        {t.rich("note", {
          c403: () => <Code>403</Code>,
          c429: () => <Code>429</Code>,
          faq: (chunks) => (
            <Link href="/" className="underline-offset-2 hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </>
  );
}
