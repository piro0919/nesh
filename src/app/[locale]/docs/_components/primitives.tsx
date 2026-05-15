export function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{children}</code>;
}

export function Snippet({ code, lang }: { code: string; lang?: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
      <code data-lang={lang}>{code}</code>
    </pre>
  );
}

export function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="ml-5 flex list-decimal flex-col gap-3">{children}</ol>;
}

export function Table({ rows }: { rows: Array<[string, string, string?]> }) {
  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-xs">
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b last:border-b-0">
              <td className="w-1/4 px-3 py-2 align-top font-medium">
                <Code>{row[0]}</Code>
              </td>
              {row.length === 3 ? (
                <>
                  <td className="w-1/4 px-3 py-2 align-top text-muted-foreground">
                    <Code>{row[1]}</Code>
                  </td>
                  <td className="px-3 py-2 align-top">{row[2]}</td>
                </>
              ) : (
                <td className="px-3 py-2 align-top">{row[1]}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-semibold tracking-tight">{children}</h1>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-medium tracking-tight">{children}</h2>;
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-medium">{children}</h3>;
}
