import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LocateFixed, RotateCcw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MapPinPicker } from '../../components/MapPinPicker';
import {
  addressMapPayload,
  addressMapSchema,
  toAddressMapValues,
  WARNING_TEXT,
  type Address,
  type AddressMapValues,
} from '../../settings/schema';
import { useDirtyReport, useResetOnChange } from '../../settings/hooks';
import { SaveBar, TabSection, type TabProps } from '../../settings/shared';

type GeocodePreview =
  | {
      ok: true;
      lat: number;
      lng: number;
      displayName: string;
      approximate: boolean;
      cached: boolean;
      query: string;
    }
  | { ok: false; reason: string };

const ADDRESS_FIELDS: { key: keyof Address; label: string; max: number; autoComplete: string }[] = [
  { key: 'line1', label: 'Street / ward', max: 200, autoComplete: 'address-line1' },
  { key: 'city', label: 'City', max: 100, autoComplete: 'address-level2' },
  { key: 'district', label: 'District', max: 100, autoComplete: 'off' },
  { key: 'province', label: 'Province', max: 100, autoComplete: 'address-level1' },
  { key: 'country', label: 'Country', max: 100, autoComplete: 'country-name' },
  { key: 'postalCode', label: 'Postal code', max: 20, autoComplete: 'postal-code' },
];

const coord = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));

export default function AddressMapTab({ settings, save, onDirty }: TabProps) {
  const values = useMemo(() => toAddressMapValues(settings), [settings]);
  const form = useForm<AddressMapValues>({
    resolver: zodResolver(addressMapSchema),
    defaultValues: values,
  });
  const { isDirty, isSubmitting, dirtyFields } = form.formState;
  useDirtyReport(isDirty, onDirty);
  useResetOnChange(form, values);
  const [lat, lng, zoom, manualOverride] = useWatch({
    control: form.control,
    name: ['lat', 'lng', 'zoom', 'manualOverride'],
  });
  const [finding, setFinding] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const setPin = useCallback(
    (p: { lat: number; lng: number }, manual: boolean) => {
      const opts = { shouldDirty: true, shouldValidate: true } as const;
      form.setValue('lat', Number(p.lat.toFixed(6)), opts);
      form.setValue('lng', Number(p.lng.toFixed(6)), opts);
      if (manual) form.setValue('manualOverride', true, opts);
    },
    [form],
  );
  // Dragging or clicking the map = the admin chose the spot.
  const onPinChange = useCallback((p: { lat: number; lng: number }) => setPin(p, true), [setPin]);

  /** Geocodes the address in the form (nothing is saved). */
  async function preview(): Promise<GeocodePreview | null> {
    try {
      const res = await api.post<{ data: GeocodePreview }>('/admin/settings/geocode', {
        address: form.getValues('address'),
      });
      const result = res.data.data;
      if (!result.ok) toast.warning(WARNING_TEXT.GEOCODE_FAILED);
      else if (result.approximate) toast.info(WARNING_TEXT.GEOCODE_APPROXIMATE);
      return result;
    } catch {
      toast.error('The map search is unavailable right now. Drag the pin instead.');
      return null;
    }
  }

  async function findOnMap() {
    setFinding(true);
    const result = await preview();
    setFinding(false);
    if (result?.ok) setPin(result, false);
  }

  /** Pin follows the address again: geocode it, then save with manualOverride off. */
  async function resetToAddress() {
    setConfirmReset(false);
    const valid = await form.trigger('address');
    if (!valid) return;
    setResetting(true);
    const result = await preview();
    if (result?.ok) {
      const saved = await save({
        address: form.getValues('address'),
        location: { lat: result.lat, lng: result.lng, manualOverride: false },
      });
      if (saved) form.reset(toAddressMapValues(saved));
    }
    setResetting(false);
  }

  const onSubmit = form.handleSubmit(async (v) => {
    const saved = await save(addressMapPayload(v, dirtyFields));
    if (saved) form.reset(toAddressMapValues(saved));
  });

  const coordField = (name: 'lat' | 'lng', label: string) => (
    <div className="space-y-2">
      <Label htmlFor={`pin-${name}`}>{label}</Label>
      <Input
        id={`pin-${name}`}
        type="number"
        step="any"
        inputMode="decimal"
        aria-invalid={!!form.formState.errors[name]}
        {...form.register(name, {
          setValueAs: coord,
          onChange: () => form.setValue('manualOverride', true, { shouldDirty: true }),
        })}
      />
      {form.formState.errors[name] && (
        <p className="text-xs font-medium text-destructive">
          {name === 'lat' ? 'Between -90 and 90' : 'Between -180 and 180'}
        </p>
      )}
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <TabSection
          title="Address"
          description="Shown on the contact page. Saving a new address moves the map pin unless the pin was set manually."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {ADDRESS_FIELDS.map(({ key, label, max, autoComplete }) => (
              <FormField
                key={key}
                control={form.control}
                name={`address.${key}`}
                render={({ field }) => (
                  <FormItem className={key === 'line1' ? 'sm:col-span-2' : undefined}>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input maxLength={max} autoComplete={autoComplete} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" onClick={findOnMap} disabled={finding}>
            {finding ? (
              <Loader2 className="mr-1 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="mr-1" aria-hidden="true" />
            )}
            Find on map
          </Button>
        </TabSection>

        <TabSection
          title="Map pin"
          description="Drag the pin or click the map to set the exact office location."
        >
          {settings.location?.approximate && !manualOverride && (
            <p className="rounded-lg border border-copper/40 bg-copper/10 px-3 py-2 text-sm">
              The saved pin is only at city level. Drag it to the exact spot.
            </p>
          )}
          <MapPinPicker lat={lat} lng={lng} zoom={zoom} onChange={onPinChange} />
          <div className="grid gap-4 sm:grid-cols-2">
            {coordField('lat', 'Latitude')}
            {coordField('lng', 'Longitude')}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin-zoom">
              Map zoom <span className="tabular-nums text-muted-foreground">({zoom})</span>
            </Label>
            <input
              id="pin-zoom"
              type="range"
              min={1}
              max={20}
              step={1}
              className="w-full accent-primary"
              {...form.register('zoom', { valueAsNumber: true })}
            />
          </div>
          <FormField
            control={form.control}
            name="manualOverride"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel>Pin set manually</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    On: address changes never move the pin. Off: saving a new address moves the pin
                    to it.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </TabSection>

        <SaveBar
          label="Save address & map"
          dirty={isDirty}
          saving={isSubmitting}
          extra={
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmReset(true)}
              disabled={resetting || isSubmitting}
            >
              <RotateCcw className="mr-1" aria-hidden="true" />
              Reset to address
            </Button>
          }
        />
        <ConfirmDialog
          open={confirmReset}
          title="Move the pin back to the address?"
          description="The address is looked up again, the pin moves there and the change is saved. Address changes will move the pin from then on."
          confirmLabel="Reset and save"
          onConfirm={() => void resetToAddress()}
          onCancel={() => setConfirmReset(false)}
        />
      </form>
    </Form>
  );
}
