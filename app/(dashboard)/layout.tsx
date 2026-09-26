import LogoutButton from "@/components/LogoutButton";
import { ToggleButton } from "@/components/ToggleButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-11 py-3 dark:border-neutral-700">
        <h1 className="text-base sm:text-lg font-bold tracking-wide text-black dark:text-white">
          DASHBOARD
        </h1>

        <div className="flex items-center gap-2 sm:gap-4">
          <ToggleButton />
          <LogoutButton />
        </div>
      </header>
      {children}
    </>
  );
}