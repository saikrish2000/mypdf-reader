export async function hashFile(file: File): Promise<string> {
  const chunk = file.size > 1024 * 1024 ? file.slice(0, 1024 * 1024) : file;
  const buf = await chunk.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
