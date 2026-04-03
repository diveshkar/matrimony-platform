import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { REPORT_REASONS } from '@/lib/constants/enums';
import { useReportUser } from '../hooks/useSettings';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
}

export function ReportDialog({ open, onOpenChange, reportedUserId }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const report = useReportUser();

  const handleSubmit = () => {
    if (!reason) return;
    report.mutate(
      { reportedUserId, reason, description: description || undefined },
      { onSuccess: () => { onOpenChange(false); setReason(''); setDescription(''); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 mb-2">
            <Flag className="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle>Report Profile</DialogTitle>
          <DialogDescription>Help us keep the community safe. Select a reason below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                reason === r.value
                  ? 'border-primary-700 bg-primary-50 font-medium'
                  : 'border-border hover:border-primary-300'
              }`}
            >
              {r.label}
            </button>
          ))}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details (optional)"
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-input bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!reason || report.isPending}>
            {report.isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
