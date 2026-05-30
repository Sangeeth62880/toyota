import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  respond,
} from "@/lib/api-helpers";

function isValidMonth(month: string): boolean {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(month);
}

function toMonthDate(month: string): string {
  return `${month}-01`;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return respond.unauthorized();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const officerIdParam = searchParams.get("officer_id");

    if (!month) {
      return respond.badRequest("'month' query parameter is required (format: YYYY-MM)");
    }

    if (!isValidMonth(month)) {
      return respond.badRequest("'month' must be in YYYY-MM format (e.g. 2025-06)");
    }

    const monthDate = toMonthDate(month);

    let query = supabase
      .from("sales_entries")
      .select(
        `
        id,
        officer_id,
        car_model_id,
        month,
        units_sold,
        created_at,
        updated_at,
        car_models (
          name,
          variant,
          image_url
        )
      `
      )
      .eq("month", monthDate);

    if (user.role === "officer") {
      query = query.eq("officer_id", user.id);
    } else if (officerIdParam) {
      query = query.eq("officer_id", officerIdParam);
    }

    const { data, error } = await query.order("created_at", {
      ascending: true,
    });

    if (error) return respond.serverError(error.message);

    return respond.success(data);
  } catch {
    return respond.serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    if (!user) return respond.unauthorized();
    if (user.role !== "officer") return respond.forbidden("officer");

    const body = await request.json().catch(() => null);
    if (!body) return respond.badRequest("Request body is required");

    const { car_model_id, month, units_sold } = body as {
      car_model_id?: string;
      month?: string;
      units_sold?: number;
    };

    if (!car_model_id || typeof car_model_id !== "string") {
      return respond.badRequest("'car_model_id' is required (UUID string)");
    }

    if (!month || typeof month !== "string" || !isValidMonth(month)) {
      return respond.badRequest("'month' is required in YYYY-MM format");
    }

    if (units_sold === undefined || typeof units_sold !== "number" || units_sold < 0) {
      return respond.badRequest("'units_sold' is required and must be >= 0");
    }

    if (!Number.isInteger(units_sold)) {
      return respond.badRequest("'units_sold' must be a whole number");
    }

    const { data, error } = await supabase
      .from("sales_entries")
      .upsert(
        {
          officer_id: user.id,
          car_model_id,
          month: toMonthDate(month),
          units_sold,
        },
        { onConflict: "officer_id,car_model_id,month" }
      )
      .select()
      .single();

    if (error) return respond.serverError(error.message);

    return respond.created(data);
  } catch {
    return respond.serverError();
  }
}
