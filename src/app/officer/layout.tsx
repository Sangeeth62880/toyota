import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, ROUTES } from "@/lib/constants";
import OfficerTopNav from "@/components/officer/OfficerTopNav";

interface OfficerLayoutProps {
  children: React.ReactNode;
}

export default async function OfficerLayout({ children }: OfficerLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single();

  if (!roleData || roleData.role !== ROLES.OFFICER) {
    redirect(ROUTES.LOGIN);
  }

  const userDisplayName =
    roleData.full_name?.trim() || user.email?.split("@")[0] || "Sales Officer";

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">

      <OfficerTopNav userFullName={userDisplayName} />

      <main className="flex-1 pt-[84px] px-4 pb-4 md:px-8 md:pb-8 min-h-screen">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
