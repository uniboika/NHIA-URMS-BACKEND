import type { AuthUser } from "@/src/store/authSlice";

export interface SidebarItem {
  title: string;
  path?: string;
  roles: string[];
  /** Optional: if set, user.functionalities must include this */
  module?: string;
  children?: SidebarItem[];
}

/**
 * Filters a sidebar config to only items the user is allowed to see.
 * Both conditions must pass:
 *   1. item.roles includes user.role
 *   2. if item.module is set → it must be in user.functionalities
 */
export function filterSidebar(items: SidebarItem[], user: AuthUser): SidebarItem[] {
  const modules = user.functionalities
    ? user.functionalities.split(",").map(m => m.trim())
    : [];

  return items.reduce<SidebarItem[]>((acc, item) => {
    const roleOk   = item.roles.includes(user.role);
    const moduleOk = item.module ? modules.includes(item.module) : true;

    if (!roleOk || !moduleOk) return acc;

    // Recursively filter children
    const filtered: SidebarItem = item.children
      ? { ...item, children: filterSidebar(item.children, user) }
      : item;

    acc.push(filtered);
    return acc;
  }, []);
}
