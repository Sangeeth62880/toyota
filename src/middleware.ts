import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLES, ROUTES } from "@/lib/constants";

const PUBLIC_ROUTES = new Set([ROUTES.LOGIN, "/auth/callback"]);

export async function middleware(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const redirect = (targetUrl: string | URL) => {
    const redirectResponse = NextResponse.redirect(new URL(targetUrl, request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  if (PUBLIC_ROUTES.has(pathname)) {
    if (user && pathname === ROUTES.LOGIN) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const role = roleData?.role;
      const dashboardUrl =
        role === ROLES.ADMIN
          ? ROUTES.ADMIN_DASHBOARD
          : ROUTES.OFFICER_DASHBOARD;

      return redirect(dashboardUrl);
    }

    return response;
  }

  if (!user) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return redirect(loginUrl);
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = roleData?.role;

  if (role === ROLES.ADMIN && pathname.startsWith("/officer")) {
    return redirect(ROUTES.ADMIN_DASHBOARD);
  }

  if (role === ROLES.OFFICER && pathname.startsWith("/admin")) {
    return redirect(ROUTES.OFFICER_DASHBOARD);
  }

  if (pathname === "/") {
    const dashboardUrl =
      role === ROLES.ADMIN
        ? ROUTES.ADMIN_DASHBOARD
        : ROUTES.OFFICER_DASHBOARD;

    return redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

