import { describe, it, expect } from "vitest";
import { dedupeFindings } from "@/lib/security/dedupe";
import { getStorageFileId } from "@/lib/storageKeys";

describe("app smoke", () => {
  it("dedupe returns stable finding ids", () => {
    const findings = dedupeFindings([
      { scanner: "supabase", name: "Test issue", level: "low", state: "failing" },
    ]);
    expect(findings[0].primaryScanner).toBe("supabase");
    expect(findings[0].id).toBeTruthy();
  });

  it("storage keys isolate same-named files", () => {
    const a = getStorageFileId("same.pdf", "hash-a");
    const b = getStorageFileId("same.pdf", "hash-b");
    expect(a).not.toBe(b);
  });
});
