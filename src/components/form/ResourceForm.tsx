import { useForm, Controller } from 'react-hook-form';
import type { FieldConfig } from './types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReferenceSelect } from './ReferenceSelect';
import { RichTextEditor } from './RichTextEditor';

interface Props {
  fields: FieldConfig[];
  defaultValues?: Record<string, unknown>;
  isEditing?: boolean;
  submitting?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel?: () => void;
}

function buildDefaults(fields: FieldConfig[], values?: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...values };
  for (const f of fields) {
    if (out[f.name] === undefined) {
      if (f.type === 'switch') out[f.name] = f.defaultValue ?? true;
      else if (f.type === 'location')
        out[f.name] = { address: '', latitude: '', longitude: '' };
      else out[f.name] = f.defaultValue ?? '';
    }
  }
  return out;
}

export function ResourceForm({
  fields,
  defaultValues,
  isEditing,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: buildDefaults(fields, defaultValues),
  });

  const visibleFields = fields.filter((f) => !(f.createOnly && isEditing));

  const submit = handleSubmit((raw) => {
    // Coerce number fields (location + explicit number types) before sending.
    const payload: Record<string, unknown> = {};
    for (const f of visibleFields) {
      const v = raw[f.name];
      if (f.type === 'location') {
        const loc = (v ?? {}) as Record<string, unknown>;
        payload[f.name] = {
          address: loc.address || undefined,
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
        };
      } else if (f.type === 'number') {
        payload[f.name] = v === '' || v === undefined ? undefined : Number(v);
      } else if (v === '' && !f.required) {
        payload[f.name] = undefined;
      } else {
        payload[f.name] = v;
      }
    }
    onSubmit(payload);
  });

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
      {visibleFields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          {field.type !== 'switch' && (
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
          )}

          {(() => {
            switch (field.type) {
              case 'textarea':
                return (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    rows={4}
                    {...register(field.name, { required: field.required })}
                  />
                );

              case 'richtext':
                return (
                  <Controller
                    control={control}
                    name={field.name}
                    rules={{ required: field.required }}
                    render={({ field: f }) => (
                      <RichTextEditor
                        value={(f.value as string) ?? ''}
                        onChange={f.onChange}
                        placeholder={field.placeholder}
                      />
                    )}
                  />
                );

              case 'number':
                return (
                  <Input
                    id={field.name}
                    type="number"
                    step="any"
                    placeholder={field.placeholder}
                    {...register(field.name, { required: field.required })}
                  />
                );

              case 'switch':
                return (
                  <div className="flex items-center gap-3 pt-1">
                    <Controller
                      control={control}
                      name={field.name}
                      render={({ field: f }) => (
                        <Switch
                          checked={Boolean(f.value)}
                          onCheckedChange={f.onChange}
                        />
                      )}
                    />
                    <Label htmlFor={field.name}>{field.label}</Label>
                  </div>
                );

              case 'select':
                return (
                  <Controller
                    control={control}
                    name={field.name}
                    rules={{ required: field.required }}
                    render={({ field: f }) => (
                      <Select
                        value={(f.value as string) || undefined}
                        onValueChange={f.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder ?? 'Sélectionner…'} />
                        </SelectTrigger>
                        <SelectContent>
                          {(field.options ?? []).map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                );

              case 'reference':
                return (
                  <Controller
                    control={control}
                    name={field.name}
                    rules={{ required: field.required }}
                    render={({ field: f }) => (
                      <ReferenceSelect
                        path={field.reference!.path}
                        labelKey={field.reference!.labelKey}
                        valueKey={field.reference!.valueKey}
                        value={f.value as string}
                        onChange={f.onChange}
                        placeholder={field.placeholder}
                      />
                    )}
                  />
                );

              case 'polymorphic': {
                const depValue = watch(field.polymorphic!.dependsOn) as string;
                const source = field.polymorphic!.sources[depValue];
                return (
                  <Controller
                    control={control}
                    name={field.name}
                    rules={{ required: field.required }}
                    render={({ field: f }) =>
                      source ? (
                        <ReferenceSelect
                          key={depValue}
                          path={source.path}
                          labelKey={source.labelKey}
                          value={f.value as string}
                          onChange={f.onChange}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <Input
                          disabled
                          placeholder="Choisissez d'abord le type ci-dessus"
                        />
                      )
                    }
                  />
                );
              }

              case 'location':
                return (
                  <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`${field.name}.address`} className="text-xs text-muted-foreground">
                        Adresse
                      </Label>
                      <Input
                        id={`${field.name}.address`}
                        placeholder="Cotonou, Littoral, Bénin"
                        {...register(`${field.name}.address`)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${field.name}.latitude`} className="text-xs text-muted-foreground">
                        Latitude *
                      </Label>
                      <Input
                        id={`${field.name}.latitude`}
                        type="number"
                        step="any"
                        placeholder="6.3703"
                        {...register(`${field.name}.latitude`, { required: true })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${field.name}.longitude`} className="text-xs text-muted-foreground">
                        Longitude *
                      </Label>
                      <Input
                        id={`${field.name}.longitude`}
                        type="number"
                        step="any"
                        placeholder="2.3912"
                        {...register(`${field.name}.longitude`, { required: true })}
                      />
                    </div>
                  </div>
                );

              default:
                return (
                  <Input
                    id={field.name}
                    type={
                      field.type === 'email'
                        ? 'email'
                        : field.type === 'password'
                          ? 'password'
                          : field.type === 'url'
                            ? 'url'
                            : 'text'
                    }
                    placeholder={field.placeholder}
                    {...register(field.name, { required: field.required })}
                  />
                );
            }
          })()}

          {field.help && (
            <p className="text-xs text-muted-foreground">{field.help}</p>
          )}
        </div>
      ))}
      </div>

      <div className="mt-4 flex shrink-0 justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
