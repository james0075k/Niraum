import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/** Shown in place of a page the signed-in role may not open. */
export function NoAccess() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <ShieldAlert className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">You don&apos;t have access</h1>
      <p className="text-muted-foreground">
        Your role can&apos;t open this section. Ask a superadmin if you need it.
      </p>
      <Button asChild variant="outline">
        <Link to="/admin">Back to the dashboard</Link>
      </Button>
    </div>
  );
}
