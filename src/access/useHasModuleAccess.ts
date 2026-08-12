import { useAppSelector } from "@/src/store/hooks";
import { MODULE_CONFIG } from "./moduleConfig";
import { canAccessModule } from "./accessUtils";

/**
 * Returns true if the current user can access the given parent module.
 *
 * Usage:
 *   const ok = useHasModuleAccess("Finance");
 *   const ok = useHasModuleAccess("ICT");
 */
export function useHasModuleAccess(moduleName: string): boolean {
  const user = useAppSelector(s => s.auth.user);
  if (!user) return false;

  const mod = MODULE_CONFIG.find(m => m.title === moduleName);
  if (!mod) return false;

  return canAccessModule(mod, user);
}
