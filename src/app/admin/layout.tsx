import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, ROUTES } from "@/lib/constants";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Toyota Incentive Portal — Administrative Layout Shell.
 *
 * Implements standard Server Component routing gates:
 * 1. Checks active Supabase authentication status.
 * 2. Fetches matching user_roles details from the database.
 * 3. Enforces full admin role validation, redirecting unauthorized users to /login.
 * 4. Supplies the user email address into the child AdminSidebar.
 * 5. Structures a clean responsive workspace: Left fixed navigation sidebar,
 *    Right scrollable canvas area optimized for heavy data-grid tables.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();

  // 1. Authenticate user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // 2. Query user role details
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // 3. Enforce strictly 'admin' authorization role
  if (!roleData || roleData.role !== ROLES.ADMIN) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <AdminSidebar userEmail={user.email ?? "admin@toyota.com"} />

      {/* Main Administrative Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
        {/* Responsive margin offset spacer for permanent desktop sidebar */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 md:pl-[264px] pt-[76px] md:pt-8 min-h-screen">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
