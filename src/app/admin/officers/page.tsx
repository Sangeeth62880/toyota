import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOfficersPage() {
  const supabase = await createClient();

  const { data: officersRes } = await supabase
    .from("user_roles")
    .select("user_id, full_name, email, created_at")
    .eq("role", "officer")
    .order("full_name", { ascending: true });

  const officers = officersRes || [];

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthString = `${year}-${month}-01`;

  const { data: salesRes } = await supabase
    .from("sales_entries")
    .select("officer_id, units_sold")
    .eq("month", monthString);

  const sales = salesRes || [];

  const salesMap = new Map<string, number>();
  sales.forEach((s) => {
    const currentTotal = salesMap.get(s.officer_id) || 0;
    salesMap.set(s.officer_id, currentTotal + s.units_sold);
  });

  const formattedDate = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8 select-none font-sans">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-[#0A0A0A] tracking-tight leading-none">
            Sales Officers
          </h1>
          <p className="text-[13px] text-[#767676] font-normal mt-2">
            Manage credentials, mapping roles, and volume performance metrics.
          </p>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded-[4px] px-5 py-3 shadow-sm text-center">
          <span className="block text-[11px] text-[#767676] font-bold uppercase tracking-wider">
            Active Force
          </span>
          <span className="block text-[22px] font-extrabold text-[#0A0A0A] leading-none mt-1">
            {officers.length}
          </span>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-[4px] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E5E5E5] bg-white flex justify-between items-center">
          <h2 className="font-sans font-bold text-[14px] text-[#0A0A0A] uppercase tracking-wider">
            Personnel Directory
          </h2>
          <span className="text-[12px] text-[#767676] font-medium italic">
            Sales period: {formattedDate}
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-[11px] font-bold text-[#767676] uppercase tracking-wider h-[38px] bg-[#F9F9F9]">
                <th className="py-2.5 px-6 font-bold">Full Name</th>
                <th className="py-2.5 px-6 font-bold">Email</th>
                <th className="py-2.5 px-6 font-bold">Joined Date</th>
                <th className="py-2.5 px-6 font-bold text-right pr-8">This Month's Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F4]">
              {officers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 px-6 text-center text-[13px] text-[#767676] italic">
                    No active sales officers registered in the system.
                  </td>
                </tr>
              ) : (
                officers.map((officer) => {
                  const totalUnits = salesMap.get(officer.user_id) || 0;
                  const joinedDate = new Date(officer.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={officer.user_id}
                      className="text-[13px] text-[#0A0A0A] hover:bg-[#F9F9F9] transition-colors h-[48px]"
                    >
                      <td className="py-3 px-6 font-bold">{officer.full_name || "Sales Officer"}</td>
                      <td className="py-3 px-6 text-[#767676]">{officer.email || "—"}</td>
                      <td className="py-3 px-6 text-[#767676]">{joinedDate}</td>
                      <td className="py-3 px-6 font-extrabold text-[14px] text-right pr-8 text-[#0A0A0A]">
                        {totalUnits > 0 ? (
                          <span className="text-[#EB0A1E]">{totalUnits} units</span>
                        ) : (
                          <span className="text-[#767676] font-normal">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
