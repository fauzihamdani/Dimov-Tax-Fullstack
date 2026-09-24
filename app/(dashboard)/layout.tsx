import LogoutButton from "@/components/LogoutButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="grid grid-cols-3 items-center border-b border-gray-200 px-11 py-3 dark:border-neutral-700">
        <div />
        <h1 className="text-center text-lg font-bold tracking-wide text-black dark:text-white">
          DASHBOARD
        </h1>
        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </header>
      {children}
    </>
  );
}