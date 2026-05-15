import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "./copy-button";

type Props = {
  apiBase: string;
  publicKey: string;
};

export async function SdkSetup({ apiBase, publicKey }: Props) {
  const t = await getTranslations("dashboard.sdkSetup");
  const usage = `import { usePush } from "@piro0919/next-push";

const { subscribe } = usePush({
  apiBase: "${apiBase}",
  vapidPublicKey: "${publicKey}",
  // Optional: scope this subscription to your own user identity
  // so you can target sends by user id from the dashboard / REST API.
  // userId: currentUser.id,
});`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <p className="text-muted-foreground">
          {t.rich("fullRef", {
            link: (chunks) => (
              <a href="/docs" className="underline-offset-2 hover:underline">
                {chunks}
              </a>
            ),
          })}
        </p>
        <Field label="apiBase" value={apiBase} />
        <Field label="publicKey" value={publicKey} mono />
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("example")}</span>
            <CopyButton value={usage} label={t("snippet")} />
          </div>
          <pre className="overflow-x-auto rounded border bg-muted p-3 text-xs">
            <code>{usage}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <CopyButton value={value} label={label} />
      </div>
      <code className={mono ? "break-all text-xs" : "break-all text-sm"}>{value}</code>
    </div>
  );
}
