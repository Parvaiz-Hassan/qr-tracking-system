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
      {/* Fixed 2026-09-19: this row used a plain `flex` nav with no wrap
          and no scroll, so on a phone-width screen the 5 nav items plus
          Log out button simply overflowed/squeezed the header, which
          cascaded into everything below it looking broken too. Now the
          nav scrolls horizontally on narrow screens (own scroll area,
          doesn't affect the page) while Log out stays pinned and always
          visible. */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14 gap-2">
          <nav className="flex gap-1 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-1.5 rounded-lg flex-shrink-0 ${
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
            className="text-xs text-neutral-400 hover:text-red-500 flex-shrink-0"
          >
            Log out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
