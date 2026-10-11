import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Copy, KeyRound, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, type ApiErrorBody, type ApiList } from '@/lib/api';
import { generatePassword, PASSWORD_MAX, PASSWORD_MIN } from '../auth/passwordRules';
import type { Role } from '../auth/roles';
import { useMe } from '../auth/useMe';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrength } from '../components/PasswordStrength';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

const LIMIT = 50;
const USERS_KEY = ['admin', 'users'] as const;

const when = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

const selectClass =
  'flex h-9 rounded-lg border border-input bg-background/60 px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

/** The API's own message for conflicts and refusals (e.g. "last superadmin"), shown verbatim. */
function userErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorBody>(err) && err.response) {
    const { status, data } = err.response;
    const message = data?.error?.message;
    if ((status === 403 || status === 409) && message) return message;
    if (status === 400 || status === 422) return 'Check the details and try again.';
    if (status === 404) return 'This user no longer exists.';
  }
  return fallback;
}

const inviteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(100, 'Use at most 100 characters.'),
  email: z.string().trim().email('Enter a valid email address.'),
  role: z.enum(['editor', 'admin', 'superadmin']),
  password: z
    .string()
    .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
    .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`),
});
type InviteValues = z.infer<typeof inviteSchema>;
type InviteErrors = Partial<Record<keyof InviteValues, string>>;

const EMPTY_INVITE: InviteValues = { name: '', email: '', role: 'editor', password: '' };

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [values, setValues] = useState<InviteValues>(EMPTY_INVITE);
  const [errors, setErrors] = useState<InviteErrors>({});
  const create = useMutation({
    mutationFn: async (body: InviteValues) =>
      (await api.post<{ data: UserRow }>('/admin/users', body)).data.data,
  });

  const close = () => {
    // Never keep the temporary password around after the dialog closes.
    setValues(EMPTY_INVITE);
    setErrors({});
    onClose();
  };

  const set = <K extends keyof InviteValues>(key: K, value: InviteValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(values.password);
      toast.success('Password copied');
    } catch {
      toast.error("Couldn't copy the password");
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = inviteSchema.safeParse(values);
    if (!parsed.success) {
      const next: InviteErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof InviteValues;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: (created) => {
        toast.success(`${created.name} can now sign in with the temporary password`);
        void qc.invalidateQueries({ queryKey: USERS_KEY });
        close();
      },
      onError: (err) => toast.error(userErrorMessage(err, "Couldn't create the user.")),
    });
  };

  const field = (key: keyof InviteValues) => ({
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `invite-${key}-error` : undefined,
  });
  const errorText = (key: keyof InviteValues) =>
    errors[key] ? (
      <p id={`invite-${key}-error`} className="text-xs font-medium text-destructive">
        {errors[key]}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Share the temporary password with them privately. They must change it at first sign-in.
          </DialogDescription>
        </DialogHeader>
        <form id="invite-form" onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="invite-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="invite-name"
              value={values.name}
              maxLength={100}
              autoComplete="off"
              onChange={(e) => set('name', e.target.value)}
              {...field('name')}
            />
            {errorText('name')}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="invite-email"
              type="email"
              value={values.email}
              autoComplete="off"
              onChange={(e) => set('email', e.target.value)}
              {...field('email')}
            />
            {errorText('email')}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="invite-role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="invite-role"
              className={`${selectClass} h-11 w-full px-3`}
              value={values.role}
              onChange={(e) => set('role', e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="invite-password" className="text-sm font-medium">
              Temporary password
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <PasswordInput
                  id="invite-password"
                  value={values.password}
                  maxLength={PASSWORD_MAX}
                  autoComplete="new-password"
                  onChange={(e) => set('password', e.target.value)}
                  {...field('password')}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => set('password', generatePassword())}
              >
                <KeyRound aria-hidden="true" />
                Generate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11"
                aria-label="Copy password"
                disabled={!values.password}
                onClick={() => void copy()}
              >
                <Copy aria-hidden="true" />
              </Button>
            </div>
            {errorText('password')}
            <PasswordStrength password={values.password} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form" disabled={create.isPending}>
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Users (superadmin): invite, change role, activate / deactivate. Own row is read-only. */
export default function Users() {
  const qc = useQueryClient();
  const me = useMe().data;
  const [page, setPage] = useState(1);
  const [inviting, setInviting] = useState(false);
  const [deactivating, setDeactivating] = useState<UserRow | null>(null);

  const list = useQuery({
    queryKey: [...USERS_KEY, 'list', page],
    queryFn: async () =>
      (await api.get<ApiList<UserRow>>('/admin/users', { params: { page, limit: LIMIT } })).data,
    placeholderData: keepPreviousData,
  });

  const done = (message: string) => {
    toast.success(message);
    void qc.invalidateQueries({ queryKey: USERS_KEY });
  };
  const failed = (err: unknown) => toast.error(userErrorMessage(err, "Couldn't update the user."));

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<UserRow> }) =>
      (await api.put<{ data: UserRow }>(`/admin/users/${id}`, body)).data.data,
  });
  const deactivate = useMutation({
    mutationFn: async (id: string) =>
      (await api.delete<{ data: UserRow }>(`/admin/users/${id}`)).data.data,
  });

  const changeRole = (row: UserRow, role: Role) => {
    if (role === row.role) return;
    update.mutate(
      { id: row.id, body: { role } },
      { onSuccess: (u) => done(`${u.name} is now ${role}`), onError: failed },
    );
  };

  const setActive = (row: UserRow, active: boolean) => {
    if (!active) {
      setDeactivating(row);
      return;
    }
    update.mutate(
      { id: row.id, body: { isActive: true } },
      { onSuccess: (u) => done(`${u.name} reactivated`), onError: failed },
    );
  };

  const confirmDeactivate = () => {
    if (!deactivating) return;
    const target = deactivating;
    setDeactivating(null);
    deactivate.mutate(target.id, {
      onSuccess: (u) => done(`${u.name} deactivated`),
      onError: failed,
    });
  };

  const rows = list.data?.data ?? [];
  const pages = list.data?.meta.pages ?? 1;
  const busy = update.isPending || deactivate.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Who can sign in to the admin. Role or activation changes sign the user out everywhere.
          </p>
        </div>
        <Button onClick={() => setInviting(true)}>
          <UserPlus aria-hidden="true" />
          Invite user
        </Button>
      </div>

      {list.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border p-6">
          <p className="text-sm">{userErrorMessage(list.error, "Couldn't load the users.")}</p>
          <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Last login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading
                ? Array.from({ length: 3 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map((row) => {
                    const self = row.id === me?.id;
                    return (
                      <TableRow key={row.id} className={row.isActive ? undefined : 'opacity-60'}>
                        <TableCell className="font-medium">
                          {row.name}
                          {self && (
                            <Badge variant="secondary" className="ml-2">
                              You
                            </Badge>
                          )}
                          {row.mustChangePassword && (
                            <span className="block text-xs text-muted-foreground">
                              Must change password
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          <select
                            aria-label={`Role of ${row.name}`}
                            className={selectClass}
                            value={row.role}
                            disabled={self || busy}
                            title={self ? "You can't change your own role" : undefined}
                            onChange={(e) => changeRole(row, e.target.value as Role)}
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Switch
                            aria-label={`${row.name} active`}
                            checked={row.isActive}
                            disabled={self || busy}
                            title={self ? "You can't deactivate yourself" : undefined}
                            onCheckedChange={(v) => setActive(row, v)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {row.lastLoginAt ? when.format(new Date(row.lastLoginAt)) : 'Never'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="tabular-nums">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <InviteDialog open={inviting} onClose={() => setInviting(false)} />

      <ConfirmDialog
        open={!!deactivating}
        title="Deactivate this user?"
        description={
          deactivating
            ? `${deactivating.name} is signed out and can't sign in until reactivated. Their audit history is kept.`
            : undefined
        }
        confirmLabel="Deactivate"
        destructive
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivating(null)}
      />
    </div>
  );
}
