import { describe, it, expect, beforeEach, vi } from "vitest";
import { encodeDocId, decodeDocId, buildReadPath, toDocId } from "./documentRoute";

describe("documentRoute", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {},
    });
  });

  it("encodes and decodes doc ids", () => {
    const id = "abc/hash+special";
    const encoded = encodeDocId(id);
    expect(decodeDocId(encoded)).toBe(id);
  });

  it("builds read path", () => {
    expect(buildReadPath("hash123")).toBe("/read/hash123");
  });

  it("prefers content hash for doc id", () => {
    expect(toDocId("abc", "file.pdf")).toBe("abc");
    expect(toDocId(undefined, "file.pdf")).toBe("file.pdf");
  });
});
