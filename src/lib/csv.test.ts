import { describe, expect, it } from "vitest";
import { csvResponse, toCsv } from "./csv";

describe("toCsv", () => {
  it("renders header even when there are no rows", () => {
    expect(toCsv([], ["a", "b"])).toBe("a,b\n");
  });

  it("renders simple rows in column order", () => {
    const csv = toCsv(
      [
        { a: "1", b: "2" },
        { a: "3", b: "4" },
      ],
      ["a", "b"],
    );
    expect(csv).toBe("a,b\n1,2\n3,4\n");
  });

  it("quotes cells containing commas, quotes, or newlines", () => {
    const csv = toCsv([{ a: 'has "quote"', b: "has,comma", c: "has\nnewline" }], ["a", "b", "c"]);
    expect(csv).toBe('a,b,c\n"has ""quote""","has,comma","has\nnewline"\n');
  });

  it("renders null and undefined as empty", () => {
    const csv = toCsv([{ a: null, b: undefined, c: 0 }], ["a", "b", "c"]);
    expect(csv).toBe("a,b,c\n,,0\n");
  });

  it("coerces non-string values to strings", () => {
    const csv = toCsv([{ a: 42, b: true, c: ["x", "y"] }], ["a", "b", "c"]);
    expect(csv).toBe('a,b,c\n42,true,"x,y"\n');
  });

  it("only emits requested columns even if more keys exist", () => {
    const csv = toCsv([{ a: 1, b: 2, c: 3 }], ["a", "c"]);
    expect(csv).toBe("a,c\n1,3\n");
  });
});

describe("csvResponse", () => {
  it("attaches CSV content type, filename, and no-store cache header", () => {
    const res = csvResponse("nesh-x.csv", "h\n1\n");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="nesh-x.csv"');
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
