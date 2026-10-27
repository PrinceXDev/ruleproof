import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const RevisionPicker = ({
  label,
  value,
  options,
  nameOf,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  nameOf: (id: string) => string;
  onChange: (id: string) => void;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger aria-label={label} className="min-h-9 min-w-32 py-1.5 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((id) => (
        <SelectItem key={id} value={id}>
          {nameOf(id)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default RevisionPicker;
