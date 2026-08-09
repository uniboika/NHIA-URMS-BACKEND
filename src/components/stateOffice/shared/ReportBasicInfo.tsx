import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTHS, monthLabel, labelOf } from "../constants";

interface Props {
  zones: { id: number; label: string }[];
  states: { id: number; label: string }[];
  zoneId: string; setZoneId: (v: string) => void;
  stateId: string; setStateId: (v: string) => void;
  reportYear: string; setReportYear: (v: string) => void;
  reportMonth: string; setReportMonth: (v: string) => void;
  submitDate: string; setSubmitDate: (v: string) => void;
  lockZone?: boolean;
  lockState?: boolean;
}

export default function ReportBasicInfo({
  zones, states, zoneId, setZoneId, stateId, setStateId,
  reportYear, setReportYear, reportMonth, setReportMonth, submitDate, setSubmitDate,
  lockZone, lockState,
}: Props) {
  const zoneLabel  = labelOf(zones.map(z => ({ value: String(z.id), label: z.label })), zoneId, "—");
  const stateLabel = labelOf(states.map(s => ({ value: String(s.id), label: s.label })), stateId, "—");

  return (
    <Card className="rounded-2xl border-[#d4e8dc]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Basic Information</CardTitle>
        <CardDescription>State, zone, and reporting period for this submission.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Zone <span className="text-red-500">*</span></Label>
            <Select value={zoneId} onValueChange={setZoneId} disabled={lockZone}>
              <SelectTrigger className={`w-full ${lockZone ? "opacity-70 bg-slate-50" : ""}`} displayValue={zoneLabel}>
                <SelectValue placeholder="Select Zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map(z => <SelectItem key={z.id} value={String(z.id)}>{z.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>State <span className="text-red-500">*</span></Label>
            <Select value={stateId} onValueChange={setStateId} disabled={lockState || !zoneId}>
              <SelectTrigger className={`w-full ${lockState ? "opacity-70 bg-slate-50" : ""}`} displayValue={stateLabel}>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date of Submission</Label>
            <Input type="date" value={submitDate} onChange={e => setSubmitDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Reporting Month <span className="text-red-500">*</span></Label>
            <Select value={reportMonth} onValueChange={setReportMonth}>
              <SelectTrigger className="w-full" displayValue={monthLabel(reportMonth)}>
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reporting Year <span className="text-red-500">*</span></Label>
            <Input type="number" min="2000" max="2100" value={reportYear} onChange={e => setReportYear(e.target.value)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
