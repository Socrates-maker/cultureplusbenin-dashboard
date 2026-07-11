import { useCollection } from '@/lib/crud';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  path: string;
  labelKey: string;
  valueKey?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** A <Select> whose options come from a REST collection. */
export function ReferenceSelect({
  path,
  labelKey,
  valueKey = '_id',
  value,
  onChange,
  placeholder = 'Sélectionner…',
  disabled,
}: Props) {
  const { data, isLoading } = useCollection<Record<string, unknown>>(path);

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue
          placeholder={isLoading ? 'Chargement…' : placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {(data ?? []).map((row) => {
          const val = String(row[valueKey] ?? '');
          return (
            <SelectItem key={val} value={val}>
              {String(row[labelKey] ?? val)}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
