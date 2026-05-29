import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, ROUTES } from "@/lib/constants";
import OfficerTopNav from "@/components/officer/OfficerTopNav";

interface OfficerLayoutProps {
  children: React.ReactNode;
}

/**
 * Toyota Incentive Portal — Officer Layout Shell.
 *
 * Implements standard Server Component routing gates:
 * 1. Checks active Supabase authentication status.
 * 2. Queries matching user_roles details from the database.
 * 3. Enforces full officer role validation, redirecting unauthorized users to /login.
 * 4. Supplies the user full_name (with backup email) to OfficerTopNav.
 * 5. Structures a clean workspace with top-padding offset for the fixed header bar.
 */
export default async function OfficerLayout({ children }: OfficerLayoutProps) {
  const supabase = await createClient();

  // 1. Authenticate user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 2. Query user role and display name
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single();

  // 3. Enforce strictly 'officer' authorization role
  if (!roleData || roleData.role !== ROLES.OFFICER) {
    redirect(ROUTES.LOGIN);
  }

  const userDisplayName =
    roleData.full_name?.trim() || user.email?.split("@")[0] || "Sales Officer";

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      {/* Top Header Navigation */}
      <OfficerTopNav userFullName={userDisplayName} />

      {/* Main Officer Work Canvas */}
      <main className="flex-1 pt-[84px] px-4 pb-4 md:px-8 md:pb-8 min-h-screen">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
