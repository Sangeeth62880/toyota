import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, ROUTES } from "@/lib/constants";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!roleData || roleData.role !== ROLES.ADMIN) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col md:flex-row overflow-hidden">

      <AdminSidebar userEmail={user.email ?? "admin@toyota.com"} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8 md:pl-[264px] pt-[76px] md:pt-8 min-h-screen">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
