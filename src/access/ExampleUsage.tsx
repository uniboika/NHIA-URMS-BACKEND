/**
 * ExampleUsage.tsx
 * Shows how to use every piece of the access control system.
 * Delete this file once you've wired things up.
 */

import * as React from "react";
import { Provider } from "react-redux";
import { store } from "@/src/store/store";
import { setCredentials } from "@/src/store/authSlice";
import ProtectedRoute from "./ProtectedRoute";
import AccessControl from "./AccessControl";
import { useHasAccess } from "./useHasAccess";
import { filterSidebar, type SidebarItem } from "./filterSidebar";
import { SIDEBAR_CONFIG } from "./routeConfig";
import { useAppSelector } from "@/src/store/hooks";

// ─── 1. Seed a mock user into the store ──────────────────────────────────────
store.dispatch(setCredentials({
  token: "mock-jwt-token",
  user: {
    id: 1,
    name: "Amina Yusuf",
    staff_id: "SO-0001",
    role: "State Officer",
    functionalities: "Dashboard,Underwriting,Claims,Reports",
  },
}));

// ─── 2. Inner component (needs store in context) ──────────────────────────────
function PageContent() {
  const user = useAppSelector(s => s.auth.user)!;

  // 3. useHasAccess hook
  const canClaims      = useHasAccess("Claims");
  const canAudit       = useHasAccess("Audit");
  const canUnderwriting = useHasAccess("Underwriting", ["State Officer", "Zonal Director"]);

  // 4. Sidebar filtering
  const visibleNav = filterSidebar(SIDEBAR_CONFIG as SidebarItem[], user);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h2>Access Control Demo</h2>
      <p>Logged in as: <strong>{user.name}</strong> ({user.role})</p>
      <p>Functionalities: <code>{user.functionalities}</code></p>

      <hr />

      {/* ── useHasAccess ── */}
      <h3>useHasAccess</h3>
      <ul>
        <li>Claims: {canClaims ? "✅ allowed" : "❌ denied"}</li>
        <li>Audit: {canAudit ? "✅ allowed" : "❌ denied"}</li>
        <li>Underwriting (role-gated): {canUnderwriting ? "✅ allowed" : "❌ denied"}</li>
      </ul>

      {/* ── AccessControl wrapper ── */}
      <h3>AccessControl component</h3>
      <AccessControl module="Claims">
        <button>Submit Claim</button>
      </AccessControl>
      <AccessControl module="Audit" fallback={<p style={{ color: "red" }}>Audit button hidden (no access)</p>}>
        <button>Open Audit Log</button>
      </AccessControl>

      {/* ── Filtered sidebar ── */}
      <h3>Filtered Sidebar</h3>
      <ul>
        {visibleNav.map(item => (
          <li key={item.path}>{item.title} → {item.path}</li>
        ))}
      </ul>

      {/* ── ProtectedRoute wrapping a page section ── */}
      <h3>ProtectedRoute</h3>
      <ProtectedRoute roles={["State Officer"]} module="Claims">
        <div style={{ background: "#e8f5ee", padding: 12, borderRadius: 8 }}>
          Claims page content — visible to State Officers with Claims access
        </div>
      </ProtectedRoute>

      <ProtectedRoute roles={["Admin"]} module="Settings">
        <div style={{ background: "#fef3c7", padding: 12, borderRadius: 8 }}>
          Settings — Admin only (you should see the unauthorized fallback)
        </div>
      </ProtectedRoute>
    </div>
  );
}

// ─── 5. Wrap with Provider ────────────────────────────────────────────────────
export default function ExampleUsage() {
  return (
    <Provider store={store}>
      <PageContent />
    </Provider>
  );
}
