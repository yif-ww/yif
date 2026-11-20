// lib/mobile-api/pagination.ts — cursor pagination for list routes.
//
// Lists are ordered by a date and then by ID, and the cursor remembers where
// the last page ended. Unlike page numbers, this stays correct when new rows
// arrive while someone is scrolling.

import { z } from "zod";
import { ApiError } from "./http";

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export const pageQuerySchema = z.object({
  cursor: z.string().max(300).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export type Cursor = { at: string; id: string };

export function encodeCursor(at: Date, id: string): string {
  return Buffer.from(JSON.stringify({ at: at.toISOString(), id } satisfies Cursor)).toString(
    "base64url",
  );
}

export function decodeCursor(raw: string | undefined): { at: Date; id: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<Cursor>;
    const at = new Date(String(parsed.at));
    if (typeof parsed.id === "string" && !Number.isNaN(at.getTime())) {
      return { at, id: parsed.id };
    }
  } catch {
    // fall through
  }
  throw new ApiError(400, "VALIDATION_FAILED", "That page marker is not valid.", {
    cursor: "Invalid cursor",
  });
}

export type Page<T> = { items: T[]; nextCursor: string | null };

/**
 * Trims a result that was fetched with `limit + 1` rows into a page, and makes
 * the cursor for the next one from the last row kept.
 */
export function toPage<Row, Item>(
  rows: Row[],
  limit: number,
  cursorOf: (row: Row) => { at: Date; id: string },
  serialize: (row: Row) => Item,
): Page<Item> {
  const hasMore = rows.length > limit;
  const kept = hasMore ? rows.slice(0, limit) : rows;
  const last = kept[kept.length - 1];
  return {
    items: kept.map(serialize),
    nextCursor: hasMore && last ? encodeCursor(cursorOf(last).at, cursorOf(last).id) : null,
  };
}

/**
 * The `where` condition that continues after a cursor. For descending lists
 * rows must be older than the cursor (or the same time with a smaller ID).
 */
export function keysetAfter<Field extends string>(
  field: Field,
  cursor: { at: Date; id: string } | null,
  direction: "asc" | "desc",
): Record<string, unknown> {
  if (!cursor) return {};
  const op = direction === "desc" ? "lt" : "gt";
  return {
    OR: [
      { [field]: { [op]: cursor.at } },
      { [field]: cursor.at, id: { [op]: cursor.id } },
    ],
  };
}
