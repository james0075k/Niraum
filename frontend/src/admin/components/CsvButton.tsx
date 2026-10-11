import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cleanParams } from '../inbox/inbox';

/**
 * Downloads a CSV through `api` (so an expired access token is refreshed first) and saves it
 * via an object URL. `params` are sent as the query string; empty ones are dropped.
 */
export function CsvButton({
  path,
  filename,
  params = {},
  label = 'Export CSV',
}: {
  path: string;
  filename: string;
  params?: Record<string, unknown>;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await api.get<Blob>(path, { params: cleanParams(params), responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Give the browser a tick to start the download before releasing the blob.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      toast.error("Couldn't export the CSV. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant="outline" disabled={busy} onClick={() => void download()}>
      {busy ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Download aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
