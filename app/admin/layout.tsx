"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products & Batches" },
  { href: "/admin/scans", label: "Scan Log" },
  { href: "/admin/blocked", label: "Blocked QR Codes" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-1.5 rounded-lg ${
                    active
                      ? "bg-emerald-50 text-emerald-800 font-medium"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="text-xs text-neutral-400 hover:text-red-500"
          >
            Log out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
