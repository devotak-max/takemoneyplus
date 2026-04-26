import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NavBar from "../components/NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) redirect("/entrar");
  return (
    <div className="min-h-screen bg-canvas">
      <NavBar userName={user.fullName} />
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
