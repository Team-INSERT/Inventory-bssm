import { createClient } from "@/shared/api/supabase/server";
import { redirect } from "next/navigation";

import { AdminNav } from "@/widgets/admin-nav/ui/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
      <aside className="w-full lg:w-1/5 shrink-0 min-w-0">
        <AdminNav />
      </aside>
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
