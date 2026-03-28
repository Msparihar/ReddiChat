"use client";

import { useState } from "react";
import { useSession, signOut } from "@/lib/auth/client";
import { useTheme } from "@/components/providers/theme-provider";
import { useUsage } from "@/hooks/use-usage";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Sun, Moon, Mail, Crown, ChevronUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface ProfileDropdownProps {
  isCollapsed: boolean;
}

export function ProfileDropdown({ isCollapsed }: ProfileDropdownProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { data: usageData, isLoading: usageLoading, isError: usageError } = useUsage();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const user = session?.user;

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim().length > 50) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: newName.trim() }),
      });
      if (res.status === 401) {
        toast.error("Session expired. Please sign in again.");
        await signOut();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update name");
        return;
      }
      toast.success("Name updated!");
      setIsEditingName(false);
      window.location.reload();
    } catch {
      toast.error("Failed to update name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const usagePercent = usageData
    ? Math.min(100, (usageData.usage.messages / usageData.limits.messages) * 100)
    : 0;

  const resetLabel = usageData?.resetAt
    ? `Resets ${formatDistanceToNow(new Date(usageData.resetAt), { addSuffix: true })}`
    : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center w-full rounded-md p-1.5 transition-colors",
            isDark ? "hover:bg-gray-800" : "hover:bg-gray-200",
            isCollapsed ? "justify-center" : "gap-2.5"
          )}
          aria-label="Open profile menu"
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-white">
                {getUserInitials(user?.name)}
              </span>
            </div>
          )}
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className={cn("text-sm font-normal truncate", isDark ? "text-gray-100" : "text-gray-900")}>
                  {user?.name || "Guest User"}
                </div>
                <div className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                  Free
                </div>
              </div>
              <ChevronUp className={cn("w-4 h-4 flex-shrink-0", isDark ? "text-gray-500" : "text-gray-400")} />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={isCollapsed ? "right" : "top"}
        align="start"
        className={cn(
          "w-72 z-50",
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}
      >
        {/* Profile Header */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            {user?.image ? (
              <img src={user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">{getUserInitials(user?.name)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className={cn("text-sm font-medium truncate", isDark ? "text-gray-100" : "text-gray-900")}>
                {user?.name || "Guest User"}
              </div>
              <div className={cn("text-xs truncate", isDark ? "text-gray-400" : "text-gray-500")}>
                {user?.email || ""}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className={isDark ? "bg-gray-700" : "bg-gray-200"} />

        {/* Usage Overview */}
        <div className="px-3 py-2">
          <div className={cn("text-xs font-medium mb-1.5", isDark ? "text-gray-400" : "text-gray-500")}>
            Daily Usage
          </div>
          {usageLoading ? (
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : usageError ? (
            <span className="text-xs text-gray-400">Usage unavailable</span>
          ) : usageData ? (
            <>
              <div className={cn("w-full h-2 rounded-full", isDark ? "bg-gray-700" : "bg-gray-200")}>
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    usagePercent > 80 ? "bg-red-500" : usagePercent > 60 ? "bg-amber-500" : "bg-purple-500"
                  )}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className={cn("text-xs mt-1 flex justify-between", isDark ? "text-gray-400" : "text-gray-500")}>
                <span>{usageData.usage.messages} of {usageData.limits.messages} messages used</span>
              </div>
              {resetLabel && (
                <div className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>
                  {resetLabel}
                </div>
              )}
            </>
          ) : null}
        </div>

        <DropdownMenuSeparator className={isDark ? "bg-gray-700" : "bg-gray-200"} />

        {/* Plan Badge */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <Crown className={cn("w-3.5 h-3.5", isDark ? "text-amber-400" : "text-amber-500")} />
            <span className={cn("text-xs font-medium", isDark ? "text-gray-300" : "text-gray-600")}>
              Free Plan — 100 msgs/day
            </span>
          </div>
        </div>

        <DropdownMenuSeparator className={isDark ? "bg-gray-700" : "bg-gray-200"} />

        {/* Settings */}
        {isEditingName ? (
          <div className="px-3 py-2">
            <div className={cn("text-xs font-medium mb-1.5", isDark ? "text-gray-400" : "text-gray-500")}>
              Display Name
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={user?.name || "Your name"}
                maxLength={50}
                className={cn(
                  "flex-1 text-sm px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500",
                  isDark ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"
                )}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={isSaving || !newName.trim()}
                className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
              >
                {isSaving ? "..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className={cn("text-xs px-2 py-1 rounded", isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500")}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setNewName(user?.name || "");
              setIsEditingName(true);
            }}
            className={cn("cursor-pointer", isDark ? "hover:bg-gray-800" : "hover:bg-gray-50")}
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="text-sm">Edit display name</span>
          </DropdownMenuItem>
        )}

        {/* Theme Toggle */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
          className={cn("cursor-pointer", isDark ? "hover:bg-gray-800" : "hover:bg-gray-50")}
        >
          {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
          <span className="text-sm">{isDark ? "Light mode" : "Dark mode"}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className={isDark ? "bg-gray-700" : "bg-gray-200"} />

        {/* Billing Contact */}
        <DropdownMenuItem asChild className={cn("cursor-pointer", isDark ? "hover:bg-gray-800" : "hover:bg-gray-50")}>
          <a href="mailto:manishsparihar2020@gmail.com" className="flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            <span className="text-sm">Contact for billing</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator className={isDark ? "bg-gray-700" : "bg-gray-200"} />

        {/* Sign Out */}
        <DropdownMenuItem
          onSelect={() => handleLogout()}
          className={cn("cursor-pointer text-red-500", isDark ? "hover:bg-gray-800" : "hover:bg-gray-50")}
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="text-sm">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
