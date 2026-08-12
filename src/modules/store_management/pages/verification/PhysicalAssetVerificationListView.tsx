import React, { useEffect, useMemo, useState } from "react";
import { storeManagementApi } from "@/src/services/storeManagementApi";
import { useNavigate } from "react-router-dom";
import CustomTable, { CustomTableField } from "@/components/CustomTable";
import { Button } from "@/components/ui/button";
import { Plus, Eye, ClipboardCheck, Trash2 } from "lucide-react";
import PageLayout from "../../components/PageLayout";
import ListSearchBar from "../../components/ListSearchBar";
import MetricCards from "../../components/MetricCards";

type ConditionBucket = "good" | "defective" | "missing" | "obsolete" | "retired";

const BUCKET_BADGE: Record<ConditionBucket, { label: string; className: string }> = {
  good: { label: "Good", className: "bg-[#e8f5ee] text-[#0f3d2e]" },
  defective: { label: "Defective", className: "bg-rose-50 text-rose-800" },
  missing: { label: "Missing", className: "bg-slate-100 text-slate-700" },
  obsolete: { label: "Obsolete", className: "bg-amber-100 text-amber-950" },
  retired: { label: "Retired", className: "bg-slate-200 text-slate-700" },
};

function conditionBucket(asset: any): ConditionBucket {
  const blob = [
    asset.physicalCondition,
    asset.operationalStatus,
    asset.status,
    asset.verificationStatus,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\bretir|\bdispos/.test(blob)) return "retired";
  if (/\bobsolete/.test(blob)) return "obsolete";
  if (/\bmissing|\blost/.test(blob)) return "missing";
  if (/\bdefect|\bpoor|\bdamaged|\brepair/.test(blob)) return "defective";
  return "good";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PhysicalAssetVerificationListView() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<ConditionBucket | "all">("all");

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await storeManagementApi.getAssets();
      if (res.success && Array.isArray(res.data)) setAssets(res.data);
      else if (Array.isArray(res)) setAssets(res);
      else setAssets([]);
    } catch (err: any) {
      setError(err.message || "Failed to load assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) =>
      [a.assetId, a.assetNumber, a.nhiaTagNumber, a.name, a.assignedCustodian, a.custodian, a.officeDeptUnit, a.primaryCategory]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [assets, query]);

  const counts = useMemo(() => {
    const next = { good: 0, defective: 0, missing: 0, obsolete: 0, retired: 0 };
    for (const a of searched) next[conditionBucket(a)] += 1;
    return next;
  }, [searched]);

  const filtered = useMemo(() => {
    if (bucket === "all") return searched;
    return searched.filter((a) => conditionBucket(a) === bucket);
  }, [searched, bucket]);

  const toggleBucket = (next: ConditionBucket | "all") => {
    setBucket((prev) => (prev === next ? "all" : next));
  };

  const openDisposal = (asset?: any) => {
    const params = new URLSearchParams({ reason: "OBSOLETE" });
    if (asset?.id) params.set("assetId", String(asset.id));
    navigate(`/store-management/disposal/records?${params.toString()}`);
  };

  const metrics = [
    { label: "Total assets", value: searched.length, hint: "On the register", onClick: () => setBucket("all"), active: bucket === "all" },
    { label: "Good", value: counts.good, hint: "Serviceable", tone: "ok" as const, onClick: () => toggleBucket("good"), active: bucket === "good" },
    { label: "Defective", value: counts.defective, hint: "Poor / damaged", tone: counts.defective ? "bad" as const : "default" as const, onClick: () => toggleBucket("defective"), active: bucket === "defective" },
    { label: "Missing", value: counts.missing, hint: "Not found", onClick: () => toggleBucket("missing"), active: bucket === "missing" },
    {
      label: "Obsolete",
      value: counts.obsolete,
      hint: "Click to dispose",
      tone: "warn" as const,
      onClick: () => {
        setBucket("obsolete");
        if (counts.obsolete > 0) openDisposal();
      },
      active: bucket === "obsolete",
    },
    { label: "Retired", value: counts.retired, hint: "Disposed / written off", onClick: () => toggleBucket("retired"), active: bucket === "retired" },
  ];

  const fields: CustomTableField[] = [
    {
      title: "Tag",
      value: "assetId",
      className: "whitespace-nowrap",
      custom: true,
      component: (item) => (
        <span className="font-mono text-sm font-semibold tabular-nums text-[#145c3f] whitespace-nowrap">
          {item.assetId || item.assetNumber || item.nhiaTagNumber || `AST-${item.id}`}
        </span>
      ),
    },
    { title: "Name", value: "name", className: "font-medium text-slate-900 min-w-[160px]" },
    {
      title: "Category",
      value: "primaryCategory",
      custom: true,
      component: (item) => (
        <span className="text-slate-700 whitespace-nowrap">{item.primaryCategory || item.category || "—"}</span>
      ),
    },
    {
      title: "Custodian",
      value: "assignedCustodian",
      custom: true,
      component: (item) => (
        <span className="text-slate-800 whitespace-nowrap">{item.assignedCustodian || item.custodian || "—"}</span>
      ),
    },
    {
      title: "Location",
      value: "officeDeptUnit",
      custom: true,
      component: (item) => (
        <span className="text-slate-700 whitespace-nowrap">
          {item.officeDeptUnit || item.department || item.location || "—"}
        </span>
      ),
    },
    {
      title: "Condition",
      value: "physicalCondition",
      className: "whitespace-nowrap",
      custom: true,
      component: (item) => {
        const tone = BUCKET_BADGE[conditionBucket(item)];
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tone.className}`}>
            {tone.label}
          </span>
        );
      },
    },
    {
      title: "Last verified",
      value: "lastVerificationDate",
      className: "whitespace-nowrap",
      custom: true,
      component: (item) => (
        <span className="text-slate-700 tabular-nums whitespace-nowrap">{formatDate(item.lastVerificationDate)}</span>
      ),
    },
    {
      title: "",
      value: "id",
      className: "text-right whitespace-nowrap",
      custom: true,
      component: (item) => {
        const id = item.id || item.assetId || item.assetNumber;
        const obsolete = conditionBucket(item) === "obsolete";
        return (
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            {obsolete ? (
              <Button
                size="sm"
                aria-label={`Dispose ${item.name || "asset"}`}
                onClick={() => openDisposal(item)}
                className="h-8 px-2.5 text-[11px] font-semibold bg-amber-400 hover:bg-amber-500 text-amber-950"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Dispose
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              aria-label={`View ${item.name || "asset"}`}
              onClick={() => navigate(`/store-management/assets/detail/${encodeURIComponent(String(id))}`)}
              className="h-8 px-2.5 text-[11px] font-semibold border-slate-200"
            >
              <Eye className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> View
            </Button>
            <Button
              size="sm"
              aria-label={`Verify ${item.name || "asset"}`}
              onClick={() =>
                navigate(`/store-management/verification/verify/asset/${encodeURIComponent(String(item.id))}`)
              }
              className="h-8 px-2.5 text-[11px] font-semibold bg-[#145c3f] hover:bg-[#0f3d2e] text-white"
            >
              <ClipboardCheck className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Verify
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageLayout
      title="Physical Asset Verification"
      description="Condition of tagged assets — verify, mark obsolete, or dispose"
      actions={
        <Button
          size="sm"
          onClick={() => navigate("/store-management/assets/register")}
          className="bg-[#145c3f] hover:bg-[#0f3d2e] text-white text-xs h-9 font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" /> Register Asset
        </Button>
      }
      contentClassName="gap-3 min-w-0"
    >
      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      <MetricCards items={metrics} />

      {bucket === "obsolete" && counts.obsolete > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
          <p className="text-xs font-semibold text-amber-950">
            {counts.obsolete} obsolete {counts.obsolete === 1 ? "asset" : "assets"} ready for disposal
          </p>
          <Button
            size="sm"
            type="button"
            onClick={() => openDisposal()}
            className="h-8 text-[11px] font-semibold bg-amber-400 hover:bg-amber-500 text-amber-950"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Initiate disposal
          </Button>
        </div>
      ) : null}

      <ListSearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search tag, name, custodian…"
        id="verify-search"
      />

      <div className="min-w-0 w-full overflow-x-auto">
        <CustomTable
          data={filtered}
          fields={fields}
          filter={false}
          loading={loading}
          pageSize={20}
          message={
            bucket === "all"
              ? "No assets registered yet — add an asset first"
              : `No ${bucket} assets match this search`
          }
        />
      </div>
    </PageLayout>
  );
}
