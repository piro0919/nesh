import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Code, H1, Ol, Snippet } from "../_components/primitives";

export async function generateMetadata() {
  const t = await getTranslations("docs.quickStart");
  return { title: t("metaTitle") };
}

export default function Page() {
  const t = useTranslations("docs.quickStart");
  return (
    <>
      <H1>{t("title")}</H1>
      <Ol>
        <li>
          {t.rich("step1", {
            signUp: (chunks) => <strong>{chunks}</strong>,
            code: () => <Code>/sign-up</Code>,
          })}
        </li>
        <li>
          {t("step2Lead")}
          <Snippet code={`pnpm add @piro0919/next-push`} lang="bash" />
        </li>
        <li>
          {t.rich("step3Lead", { code: () => <Code>usePush</Code> })}
          <Snippet
            code={`'use client';
import { usePush } from "@piro0919/next-push";

export function Subscribe() {
  const { subscribe } = usePush({
    apiBase: "https://nesh.kkweb.io/api/v1/projects/<projectId>",
    vapidPublicKey: "<VAPID public key>",
    // Optional — scope subscriptions to your application's user id
    // so you can target sends by user from the dashboard / REST API.
    userId: currentUser.id,
  });
  return <button onClick={subscribe}>Enable notifications</button>;
}`}
            lang="tsx"
          />
        </li>
        <li>
          {t.rich("step4Lead", {
            sw: () => <Code>public/sw.js</Code>,
            pkg: () => <Code>@piro0919/next-push/sw</Code>,
          })}
          <Snippet
            code={`import { handlePush, handleClick } from "@piro0919/next-push/sw";

self.addEventListener("push", (event) => handlePush(event));
self.addEventListener("notificationclick", (event) => handleClick(event));`}
            lang="js"
          />
        </li>
        <li>{t("step5")}</li>
      </Ol>
    </>
  );
}
