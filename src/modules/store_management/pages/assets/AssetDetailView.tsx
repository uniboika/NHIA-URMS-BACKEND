import React, { useState, useEffect } from "react";
import PageLayout from "@/src/modules/store_management/components/PageLayout";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { storeManagementApi } from "@/src/services/storeManagementApi";
import { ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-0.5 text-sm font-semibold text-slate-900 break-words">{children ?? "—"}</div>
    </div>
  );
}

function conditionTone(raw: string) {
  const v = String(raw || "").toLowerCase();
  if (/\bretir|\bdispos/.test(v)) return { label: "Retired", className: "bg-slate-200 text-slate-700" };
  if (/\bobsolete/.test(v)) return { label: "Obsolete", className: "bg-amber-100 text-amber-950" };
  if (/\bmissing|\blost/.test(v)) return { label: "Missing", className: "bg-slate-100 text-slate-700" };
  if (/\bdefect|\bpoor|\bdamaged|\brepair/.test(v)) return { label: "Defective", className: "bg-rose-50 text-rose-800" };
  return { label: raw || "Good", className: "bg-[#e8f5ee] text-[#0f3d2e]" };
}

export function AssetDetailView() {
  const { id: rawId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const pathname = location.pathname;
  const detailPrefix = "/store-management/assets/detail/";
  let extractedId = rawId ? decodeURIComponent(rawId) : "";
  if (pathname.includes(detailPrefix)) {
    const tail = pathname.substring(pathname.indexOf(detailPrefix) + detailPrefix.length);
    if (tail) extractedId = decodeURIComponent(tail);
  }

  useEffect(() => {
    if (!extractedId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await storeManagementApi.getAssetById(extractedId);
        if (!cancelled) setAsset(res?.data || res || null);
      } catch {
        if (!cancelled) setAsset(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [extractedId]);

  if (loading) {
    return (
      <PageLayout title="Asset" description="Loading…">
        <div className="h-40 rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
      </PageLayout>
    );
  }

  if (!asset) {
    return (
      <PageLayout
        title="Asset not found"
        description="This record is not in the master register"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Back
          </Button>
        }
      >
        <p className="text-sm text-slate-700">No asset for reference {extractedId || "—"}.</p>
      </PageLayout>
    );
  }

  const tag = asset.assetId || asset.assetNumber || asset.nhiaTagNumber || `AST-${asset.id}`;
  const cost = Number(asset.acquisitionCost || asset.acquisitionValue || 0);
  const accum = Number(asset.accumulatedDepreciation || 0);
  const nbv = Number(asset.netBookValue || asset.currentValue || Math.max(0, cost - accum));
  const attrs = Object.entries(asset.categoryAttributes || {});
  const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const cond = conditionTone(asset.physicalCondition || asset.operationalStatus || "Good");

  return (
    <PageLayout
      title={asset.name || "Asset"}
      description={tag}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Back
          </Button>
          <Button
            size="sm"
            onClick={() =>
              navigate(`/store-management/verification/verify/asset/${encodeURIComponent(String(asset.id))}`)
            }
            className="bg-[#145c3f] hover:bg-[#0f3d2e] text-white text-xs font-semibold"
          >
            <ClipboardCheck className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Verify
          </Button>
        </div>
      }
      contentClassName="gap-3"
    >
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-[#f4f7f5] px-4 py-3">
          <span className="font-mono text-sm font-bold text-[#145c3f]" translate="no">{tag}</span>
          <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${cond.className}`}>
            {cond.label}
          </span>
          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {asset.verificationStatus || "Unverified"}
          </span>
          <span className="ml-auto text-[11px] font-semibold text-slate-500 tabular-nums">
            Last verified {asset.lastVerificationDate || "Never"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3 p-4">
          <Field label="Category">{asset.primaryCategory || asset.category || "—"}</Field>
          <Field label="Subcategory">{asset.subCategory || "—"}</Field>
          <Field label="Custodian">{asset.assignedCustodian || asset.custodian || "Unassigned"}</Field>
          <Field label="Store / location">{asset.officeDeptUnit || asset.location || asset.facilitySite || "—"}</Field>
          <Field label="Room / spot">{asset.specificLocation || "—"}</Field>
          <Field label="NHIA tag">{asset.nhiaTagNumber || asset.barcodeQrCode || tag}</Field>
          <Field label="Acquisition">{naira.format(cost)}</Field>
          <Field label="Net book value">{naira.format(nbv)}</Field>
          <Field label="Accum. dep.">{naira.format(accum)}</Field>
          <Field label="Useful life">{asset.usefulLifeYears || 5} yrs</Field>
          <Field label="Acquired">{asset.acquisitionDate || asset.date || asset.purchaseDate || "—"}</Field>
          <Field label="Method">{asset.depreciationMethod || "Straight-Line"}</Field>
        </div>

        {attrs.length > 0 ? (
          <div className="border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3 p-4">
            {attrs.map(([key, val]) => (
              <Field key={key} label={key.replace(/([A-Z])/g, " $1").trim()}>
                {String(val)}
              </Field>
            ))}
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}

export default AssetDetailView;
