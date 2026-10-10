import { KeyRound } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { can, type Role } from '../auth/roles';
import { NAV, NAV_GROUPS } from '../nav';

/**
 * Ctrl/Cmd+K palette: jump to any section the role can open (archived ones included), or to
 * "Change password". `open` is owned by the layout so the topbar search button can open it.
 */
export function CommandPalette({
  role,
  open,
  onOpenChange,
}: {
  role: Role | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const visible = NAV.filter((n) => can(role, n.area));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Search admin</DialogTitle>
        <DialogDescription className="sr-only">
          Type to find a section, then press Enter to open it.
        </DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3">
          <CommandInput placeholder="Search admin…" />
          <CommandList>
            <CommandEmpty>No matching section.</CommandEmpty>
            {NAV_GROUPS.map((group) => {
              const items = visible.filter((n) => n.group === group);
              if (items.length === 0) return null;
              return (
                <CommandGroup key={group} heading={group}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.to}
                        value={item.label}
                        keywords={[item.group]}
                        onSelect={() => go(item.to)}
                      >
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                        {item.archived && (
                          <span className="ml-auto text-xs text-muted-foreground">Archived</span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
            <CommandGroup heading="Account">
              <CommandItem value="Change password" onSelect={() => go('/admin/change-password')}>
                <KeyRound aria-hidden="true" />
                <span>Change password</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
