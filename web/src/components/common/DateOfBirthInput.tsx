import { useMemo } from 'react';

interface DateOfBirthInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  error?: boolean;
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const selectClass = (hasError: boolean) =>
  `flex h-11 rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
    hasError ? 'border-destructive' : 'border-input hover:border-primary-300'
  }`;

export function DateOfBirthInput({ value, onChange, error }: DateOfBirthInputProps) {
  const parts = useMemo(() => {
    if (!value) return { day: '', month: '', year: '' };
    const [year, month, day] = value.split('-');
    return { day: day || '', month: month || '', year: year || '' };
  }, [value]);

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 70;
  const maxYear = currentYear - 18;

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const days = useMemo(() => {
    const arr: number[] = [];
    const daysInMonth = parts.month && parts.year
      ? new Date(Number(parts.year), Number(parts.month), 0).getDate()
      : 31;
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [parts.month, parts.year]);

  const handleChange = (field: 'day' | 'month' | 'year', val: string) => {
    const updated = { ...parts, [field]: val };
    if (updated.day && updated.month && updated.year) {
      const paddedDay = updated.day.padStart(2, '0');
      const paddedMonth = updated.month.padStart(2, '0');
      onChange(`${updated.year}-${paddedMonth}-${paddedDay}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="flex gap-2">
      <select
        value={parts.day}
        onChange={(e) => handleChange('day', e.target.value)}
        className={`${selectClass(!!error)} w-[80px]`}
        aria-label="Day"
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={String(d)}>{d}</option>
        ))}
      </select>

      <select
        value={parts.month}
        onChange={(e) => handleChange('month', e.target.value)}
        className={`${selectClass(!!error)} flex-1`}
        aria-label="Month"
      >
        <option value="">Month</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <select
        value={parts.year}
        onChange={(e) => handleChange('year', e.target.value)}
        className={`${selectClass(!!error)} w-[90px]`}
        aria-label="Year"
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  );
}
