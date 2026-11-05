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
    <div className="min-h-full font-montserrat">
      <AuthGuard>{children}</AuthGuard>
    </div>
  );
}
