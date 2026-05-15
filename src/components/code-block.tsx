import { codeToHtml } from "shiki";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  lang?: string;
  className?: string;
};

/**
 * Server-rendered syntax-highlighted code block.
 * Light + dark variants emitted so the block reads in either color scheme.
 */
export async function CodeBlock({ code, lang = "tsx", className }: Props) {
  const html = await codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border p-4 text-xs",
        // Make the shiki <pre> show through the wrapper background
        "[&_pre]:bg-transparent! [&_pre]:p-0",
        className,
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: server-side shiki output is trusted
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
