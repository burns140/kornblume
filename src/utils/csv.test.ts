import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses plain rows and CRLF line endings", () => {
    expect(parseCsv("a,b\r\nc,d\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("keeps commas, newlines and escaped quotes inside quoted cells", () => {
    expect(parseCsv('"a, b","line1\nline2","say ""hi"""\n"x","",')).toEqual([
      ["a, b", "line1\nline2", 'say "hi"'],
      ["x", "", ""],
    ]);
  });

  it("keeps a final row that has no trailing newline", () => {
    expect(parseCsv('"a","b"')).toEqual([["a", "b"]]);
  });
});
