import { describe, it, expect } from "vitest";
import { getStorageFileId, buildCacheKey } from "@/lib/storageKeys";

describe("getStorageFileId", () => {
  it("prefers contentHash over fileName", () => {
    expect(getStorageFileId("report.pdf", "abc123")).toBe("abc123");
  });

  it("falls back to fileName when no hash", () => {
    expect(getStorageFileId("report.pdf")).toBe("report.pdf");
    expect(getStorageFileId("report.pdf", null)).toBe("report.pdf");
  });
});

describe("buildCacheKey", () => {
  it("matches storage file id", () => {
    expect(buildCacheKey("doc.pdf", "hash1")).toBe(getStorageFileId("doc.pdf", "hash1"));
  });
});
