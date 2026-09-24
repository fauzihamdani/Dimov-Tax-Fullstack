"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      title="Logout"
      className="rounded-lg px-2.5 py-1 text-black transition hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800"
    >
      <LogOut size={15} />
    </button>
  );
}