import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  respond,
} from "@/lib/api-helpers";

function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function toMonthDate(month: string): string {
  return `${month}-01`;
}

interface BulkSaleEntry {
  car_model_id: string;
  units_sold: number;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return respond.unauthorized();
    if (user.role !== "officer") return respond.forbidden("officer");

    const body = await request.json().catch(() => null);
    if (!body) return respond.badRequest("Request body is required");

    const { month, entries } = body as {
      month?: string;
      entries?: BulkSaleEntry[];
    };

    if (!month || typeof month !== "string" || !isValidMonth(month)) {
      return respond.badRequest("'month' is required in YYYY-MM format");
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return respond.badRequest("'entries' must be a non-empty array");
    }

    const seenCarModelIds = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (!entry.car_model_id || typeof entry.car_model_id !== "string") {
        return respond.badRequest(
          `entries[${i}]: 'car_model_id' is required (UUID string)`
        );
      }

      if (
        entry.units_sold === undefined ||
        typeof entry.units_sold !== "number" ||
        entry.units_sold < 0
      ) {
        return respond.badRequest(
          `entries[${i}]: 'units_sold' is required and must be >= 0`
        );
      }

      if (!Number.isInteger(entry.units_sold)) {
        return respond.badRequest(
          `entries[${i}]: 'units_sold' must be a whole number`
        );
      }

      // Check for duplicate car_model_ids in the same batch
      if (seenCarModelIds.has(entry.car_model_id)) {
        return respond.badRequest(
          `entries[${i}]: duplicate car_model_id '${entry.car_model_id}' in batch`
        );
      }
      seenCarModelIds.add(entry.car_model_id);
    }

    const monthDate = toMonthDate(month);

    const rows = entries.map((entry) => ({
      officer_id: user.id,
      car_model_id: entry.car_model_id,
      month: monthDate,
      units_sold: entry.units_sold,
    }));

    const { data, error } = await supabase
      .from("sales_entries")
      .upsert(rows, { onConflict: "officer_id,car_model_id,month" })
      .select();

    if (error) return respond.serverError(error.message);

    return respond.created(
      data,
      `Bulk upsert completed (${entries.length} entries)`
    );
  } catch {
    return respond.serverError();
  }
}
