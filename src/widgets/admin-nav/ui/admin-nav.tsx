"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Warehouse,
  PackageMinus,
  ArrowRightLeft,
  Activity,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "대시보드" },
  { href: "/admin/users", icon: Users, label: "유저 관리" },
  { href: "/admin/items", icon: PackageMinus, label: "물품 관리" },
  { href: "/admin/warehouses", icon: Warehouse, label: "창고 관리" },
  { href: "/admin/transfer", icon: ArrowRightLeft, label: "재고 이동" },
  { href: "/admin/disposals", icon: Trash2, label: "폐기 관리" },
  { href: "/admin/transactions", icon: Activity, label: "이력(로그)" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-1 lg:flex-col lg:space-x-0 lg:space-y-1.5 p-3 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 shadow-sm dark:border-zinc-800/50 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center justify-center lg:justify-start gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 group overflow-hidden",
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="adminNavActive"
                className="absolute inset-0 bg-blue-50/50 dark:bg-zinc-800 border border-blue-100/50 dark:border-zinc-700/50 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            <item.icon
              className={cn(
                "h-4 w-4 relative z-10 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-blue-600" : "text-gray-400",
              )}
            />
            <span className="relative z-10 tracking-tight whitespace-nowrap hidden lg:inline">
              {item.label}
            </span>

            {isActive && (
              <motion.div
                layoutId="adminActiveIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-600 rounded-r-full lg:block hidden"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
