import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    return <>{children}</>;
}
