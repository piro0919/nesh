import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Code, H1 } from "./_components/primitives";

export async function generateMetadata() {
  const t = await getTranslations("docs.meta");
  return { title: t("title"), description: t("description") };
}

export default function Page() {
  const t = useTranslations("docs.index");
  return (
    <>
      <H1>{t("title")}</H1>
      <p className="text-muted-foreground">{t("intro")}</p>
      <ul className="ml-5 flex list-disc flex-col gap-2">
        <li>
          <Link href="/docs/quick-start" className="underline-offset-2 hover:underline">
            {t("links.quickStart")}
          </Link>{" "}
          — {t("desc.quickStart")}
        </li>
        <li>
          <Link href="/docs/sdk" className="underline-offset-2 hover:underline">
            {t("links.sdk")}
          </Link>{" "}
          — <Code>usePush</Code> {t("desc.sdk")}
        </li>
        <li>
          <Link href="/docs/rest-api" className="underline-offset-2 hover:underline">
            {t("links.restApi")}
          </Link>{" "}
          — {t("desc.restApi")}
        </li>
        <li>
          <Link href="/docs/webhooks" className="underline-offset-2 hover:underline">
            {t("links.webhooks")}
          </Link>{" "}
          — {t("desc.webhooks")}
        </li>
        <li>
          <Link href="/docs/limits" className="underline-offset-2 hover:underline">
            {t("links.limits")}
          </Link>{" "}
          — {t("desc.limits")}
        </li>
        <li>
          <Link href="/docs/self-host" className="underline-offset-2 hover:underline">
            {t("links.selfHost")}
          </Link>{" "}
          — {t("desc.selfHost")}
        </li>
      </ul>
    </>
  );
}
