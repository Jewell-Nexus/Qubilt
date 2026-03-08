import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LucideIcon } from '@/components/ui/LucideIcon';
import { toast } from 'sonner';
import { useImportContacts } from '../hooks/use-crm-queries';

interface ImportContactsModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

const CRM_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'company', 'type'] as const;

export function ImportContactsModal({ open, onClose, workspaceId }: ImportContactsModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ created: number; updated: number; failed: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const importMut = useImportContacts();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(Boolean);
      if (lines.length < 2) { toast.error('CSV must have a header and data rows'); return; }

      const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      setCsvHeaders(headers);

      const preview = lines.slice(1, 6).map((l) =>
        l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')),
      );
      setCsvPreview(preview);

      // Auto-map matching headers
      const autoMap: Record<string, string> = {};
      headers.forEach((h) => {
        const lower = h.toLowerCase().replace(/[_\s]/g, '');
        const match = CRM_FIELDS.find((f) => f.toLowerCase() === lower);
        if (match) autoMap[h] = match;
      });
      setMapping(autoMap);
      setStep(2);
    };
    reader.readAsText(f);
  };

  const handleImport = () => {
    if (!file) return;
    importMut.mutate({ workspaceId, file, fieldMapping: mapping }, {
      onSuccess: (res) => {
        setResult(res.data);
        setStep(3);
      },
      onError: () => toast.error('Import failed'),
    });
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setCsvHeaders([]);
    setCsvPreview([]);
    setMapping({});
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border-default rounded-lg">
            <LucideIcon name="Upload" size={32} className="text-text-tertiary mb-3" />
            <p className="text-sm text-text-secondary mb-3">Upload a CSV file</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Choose File
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Map CSV columns to contact fields:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {csvHeaders.map((h) => (
                <div key={h} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate text-text-primary">{h}</span>
                  <span className="text-text-tertiary">&rarr;</span>
                  <select
                    value={mapping[h] ?? ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}
                    className="text-sm border border-border-default rounded px-2 py-1 bg-background flex-1"
                  >
                    <option value="">Skip</option>
                    {CRM_FIELDS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="text-xs text-text-tertiary">Preview (first {csvPreview.length} rows):</div>
            <div className="overflow-x-auto border border-border-default rounded text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-sunken">
                    {csvHeaders.map((h) => (
                      <th key={h} className="px-2 py-1 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, i) => (
                    <tr key={i} className="border-t border-border-default">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 truncate max-w-[120px]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-emerald-50">
                <p className="text-2xl font-semibold text-emerald-600">{result.created}</p>
                <p className="text-xs text-emerald-600">Created</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-2xl font-semibold text-blue-600">{result.updated}</p>
                <p className="text-xs text-blue-600">Updated</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <p className="text-2xl font-semibold text-red-600">{result.failed}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="text-xs text-red-500 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleImport} disabled={importMut.isPending || Object.keys(mapping).length === 0}>
                Import
              </Button>
            </>
          )}
          {step === 3 && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
