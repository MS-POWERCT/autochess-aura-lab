import type { Hero } from "../types";
import { parseImport, serializeExport, type ParseResult } from "./importExport";

export function encodeSharePayload(heroes: Hero[]): string {
  const json = serializeExport(heroes);
  return base64UrlEncode(json);
}

export function decodeSharePayload(encoded: string): ParseResult {
  try {
    const json = base64UrlDecode(encoded);
    return parseImport(json);
  } catch {
    return { ok: false, error: "分享链接无效" };
  }
}

export function readShareParam(search: string, hash: string): string | null {
  const fromQuery = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("share");
  if (fromQuery) return fromQuery;
  const hashValue = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!hashValue) return null;
  const hashParams = new URLSearchParams(hashValue);
  return hashParams.get("share");
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
