import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/store/store";
import { storeManagementApi } from "@/src/services/storeManagementApi";
import { stockApi } from "@/lib/api";
import PageLayout from "../../components/PageLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PHYSICAL_CONDITIONS } from "../../lib/storeOptions";

const VERIFY_STATUSES = ["Verified & Passed", "Partial Pass", "Exception"];

function toItemCondition(label: string) {
  const u = String(label || "Good").toUpperCase();
  if (["MISSING", "DAMAGED", "POOR", "FAIR", "GOOD", "DEFECTIVE", "OBSOLETE", "RETIRED"].includes(u)) return u;
  if (u === "EXCELLENT") return "GOOD";
  return "GOOD";
}

export default function VerifyAssetView() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);

  const [asset, setAsset] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    physicalCondition: "Good",
    verificationStatus: "Verified & Passed",
    physicalCount: 1,
    bookBalance: 1,
    verificationDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });

  useEffect(() => {
    if (!assetId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await storeManagementApi.getAssetById(assetId);
        const data = res?.data || res || null;
        if (cancelled) return;
        setAsset(data);
        if (data) {
          setForm((p) => ({
            ...p,
            physicalCondition: data.physicalCondition || "Good",
            verificationStatus: data.verificationStatus || "Verified & Passed",
          }));
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load asset");
        if (!cancelled) setAsset(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  const variance = Number(form.bookBalance || 0) - Number(form.physicalCount || 0);
  const hasException =
    form.physicalCondition === "Missing" || Number(form.physicalCount) === 0 || variance !== 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset?.id) return;
    setError(null);
    if (form.physicalCount < 0 || form.bookBalance < 0) {
      setError("Counts cannot be negative.");
      return;
    }
    if (hasException && !form.remarks.trim()) {
      setError("Add a remark for the variance, missing count, or exception.");
      return;
    }
    setSaving(true);
    try {
      const status = hasException ? "Exception" : form.verificationStatus || "Verified & Passed";

      await storeManagementApi.updateAsset(asset.id, {
        physicalCondition: form.physicalCondition,
        lastVerificationDate: form.verificationDate,
        verificationStatus: status,
        operationalStatus:
          form.physicalCondition === "Retired"
            ? "Retired"
            : form.physicalCondition === "Obsolete"
              ? "Obsolete"
              : form.physicalCondition === "Missing"
                ? "Missing"
                : undefined,
      });

      await stockApi.createPhysicalVerification({
        stocktakingType: "periodic",
        verificationDate: form.verificationDate,
        storeKeeper: user?.name || "Officer",
        auditOfficer: "",
        remarks: form.remarks,
        status: "SUBMITTED",
        items: [
          {
            assetId: asset.id,
            assetNumber: asset.assetId || asset.assetNumber || asset.nhiaTagNumber,
            assetName: asset.name,
            category: asset.primaryCategory || asset.category,
            custodian: asset.assignedCustodian || asset.custodian,
            bookBalance: Number(form.bookBalance) || 1,
            physicalCount: Number(form.physicalCount) || 0,
            condition: toItemCondition(form.physicalCondition),
            remarks: form.remarks,
          },
        ],
      });

      toast.success(hasException ? "Verification saved with exception" : "Asset verification saved");
      navigate("/store-management/verification/verify");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save verification");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25a872]/40 disabled:bg-slate-50";
  const labelCls = "block text-[11px] font-semibold text-slate-600 mb-1";

  if (loading) {
    return (
      <PageLayout title="Verify Asset" description="Loading…">
        <div className="h-48 rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
      </PageLayout>
    );
  }

  if (!asset) {
    return (
      <PageLayout
        title="Asset not found"
        description="Cannot verify this record"
        actions={
          <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/store-management/verification/verify")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Back
          </Button>
        }
      >
        <p className="text-sm text-slate-700">No asset for reference {assetId}.</p>
      </PageLayout>
    );
  }

  const tag = asset.assetId || asset.assetNumber || asset.nhiaTagNumber || `AST-${asset.id}`;

  return (
    <PageLayout
      title="Verify Asset"
      description={`${tag} · ${asset.name || ""}`}
      actions={
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => navigate("/store-management/verification/verify")}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Back to list
        </Button>
      }
      contentClassName="gap-3"
    >
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-200 bg-[#f4f7f5] px-4 py-3">
          <span className="font-mono text-sm font-bold text-[#145c3f]" translate="no">{tag}</span>
          <span className="text-sm font-semibold text-slate-900">{asset.name}</span>
          <span className="text-xs text-slate-600">{asset.primaryCategory || asset.category || "—"}</span>
          <span className="text-xs text-slate-600">{asset.assignedCustodian || asset.custodian || "Unassigned"}</span>
          <span className="text-xs text-slate-600">{asset.officeDeptUnit || asset.location || "—"}</span>
          <span className="ml-auto text-[11px] font-semibold text-slate-500 tabular-nums">
            Last verified {asset.lastVerificationDate || "Never"}
          </span>
        </div>

        <div className="p-4 space-y-3">
          {error ? (
            <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
            </div>
          ) : null}

          {hasException ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              Variance or missing count will be recorded as an exception. Add a remark before saving.
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className={labelCls} htmlFor="book-balance">Book</label>
              <input
                id="book-balance"
                name="bookBalance"
                type="number"
                min={0}
                inputMode="numeric"
                className={`${inputCls} tabular-nums`}
                value={form.bookBalance}
                onChange={(e) => setForm((p) => ({ ...p, bookBalance: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="physical-count">Physical</label>
              <input
                id="physical-count"
                name="physicalCount"
                type="number"
                min={0}
                inputMode="numeric"
                className={`${inputCls} tabular-nums`}
                value={form.physicalCount}
                onChange={(e) => setForm((p) => ({ ...p, physicalCount: Number(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className={labelCls}>Variance</label>
              <p className={`h-9 flex items-center px-3 rounded-lg border text-sm font-semibold tabular-nums ${
                variance !== 0 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-700"
              }`}>
                {variance}
              </p>
            </div>
            <div>
              <label className={labelCls} htmlFor="condition">Condition</label>
              <select
                id="condition"
                name="physicalCondition"
                className={inputCls}
                value={form.physicalCondition}
                onChange={(e) => setForm((p) => ({ ...p, physicalCondition: e.target.value }))}
              >
                {PHYSICAL_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="verify-status">Status</label>
              <select
                id="verify-status"
                name="verificationStatus"
                className={inputCls}
                value={hasException ? "Exception" : form.verificationStatus}
                disabled={hasException}
                onChange={(e) => setForm((p) => ({ ...p, verificationStatus: e.target.value }))}
              >
                {VERIFY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="verify-date">Date</label>
              <input
                id="verify-date"
                name="verificationDate"
                type="date"
                className={inputCls}
                value={form.verificationDate}
                onChange={(e) => setForm((p) => ({ ...p, verificationDate: e.target.value }))}
              />
            </div>
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <label className={labelCls} htmlFor="remarks">
                Remarks {hasException ? <span className="text-rose-500">*</span> : null}
              </label>
              <input
                id="remarks"
                name="remarks"
                className={inputCls}
                value={form.remarks}
                onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
                placeholder="Condition notes, location changes, missing parts…"
              />
            </div>
            <div>
              <p className={labelCls}>Officer</p>
              <p className="h-9 flex items-center px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 truncate">
                {user?.name || "Officer"}
              </p>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full h-9 bg-[#145c3f] hover:bg-[#0f3d2e] text-white text-xs font-bold">
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" /> : <ClipboardCheck className="h-4 w-4 mr-1.5" aria-hidden="true" />}
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}
