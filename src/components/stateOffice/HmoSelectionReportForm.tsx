import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StateOfficeFormShell from "./StateOfficeFormShell";

const uid = () => Math.random().toString(36).slice(2);

interface Props {
  reportId?: number | null;
  onBack: () => void;
  defaultZoneId?: string | null;
  defaultStateId?: string | null;
}

export default function HmoSelectionReportForm({ reportId, onBack, defaultZoneId, defaultStateId }: Props) {
  const [lines, setLines] = React.useState<any[]>([]);
  const [entry, setEntry] = React.useState({ mda: "", selection_date: "", hmos_in_attendance: "" });

  const loadData = (v: any) => {
    setLines((v.lines ?? []).map((l: any) => ({
      _key: uid(), mda: l.mda,
      selection_date: l.selection_date?.slice?.(0, 10) ?? l.selection_date ?? "",
      hmos_in_attendance: l.hmos_in_attendance ?? "",
    })));
  };

  const addLine = () => {
    if (!entry.mda.trim()) return;
    setLines(p => [...p, { _key: uid(), ...entry }]);
    setEntry({ mda: "", selection_date: "", hmos_in_attendance: "" });
  };

  return (
    <StateOfficeFormShell
      reportType="hmo-selection" reportId={reportId} onBack={onBack}
      defaultZoneId={defaultZoneId} defaultStateId={defaultStateId}
      onLoaded={loadData}
      validate={() => (lines.length === 0 ? "Add at least one meeting" : null)}
      buildPayload={(base) => ({ ...base, lines: lines.map(({ _key, ...l }) => l) })}
    >
      {() => (
        <Card className="rounded-2xl border-[#d4e8dc]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">HMO Selection Process</CardTitle>
            <CardDescription>Record MDA selection meetings and HMOs in attendance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-3 items-end">
              <div className="space-y-1"><Label>MDA</Label><Input value={entry.mda} onChange={e => setEntry(v => ({ ...v, mda: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={entry.selection_date} onChange={e => setEntry(v => ({ ...v, selection_date: e.target.value }))} /></div>
              <div className="space-y-1"><Label>HMOs in Attendance</Label><Input value={entry.hmos_in_attendance} onChange={e => setEntry(v => ({ ...v, hmos_in_attendance: e.target.value }))} /></div>
              <Button onClick={addLine} className="gap-2"><Plus className="w-4 h-4" /> Add</Button>
            </div>
            {lines.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f0fdf7]">
                    {["MDA", "Date", "HMOs in Attendance", ""].map(h => <TableHead key={h} className="text-xs font-bold">{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(l => (
                    <TableRow key={l._key}>
                      <TableCell className="text-sm font-medium">{l.mda}</TableCell>
                      <TableCell className="text-sm">{l.selection_date || "—"}</TableCell>
                      <TableCell className="text-sm">{l.hmos_in_attendance || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-rose-500"
                          onClick={() => setLines(p => p.filter(x => x._key !== l._key))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </StateOfficeFormShell>
  );
}
