import { AuthGuard } from "@/components/admin/auth-guard";

export const metadata = {
  title: "Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-montserrat bg-surface text-fg dark:bg-[#050505] dark:bg-none dark:[--surface:#050505] dark:[--surface-muted:#0a0a0a] dark:[--card:rgba(18,18,18,0.72)] dark:[--border:rgba(255,255,255,0.08)] dark:[--accent:#171717] dark:[--fg-muted:#8b8b8b]">
      <AuthGuard>{children}</AuthGuard>
    </div>
  );
}
