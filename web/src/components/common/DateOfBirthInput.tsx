import { useState, useEffect, useMemo } from 'react';

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
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Initialize from value prop
  useEffect(() => {
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      if (y) setYear(y);
      if (m) setMonth(m);
      if (d) setDay(String(Number(d))); // remove leading zero for display
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Output YYYY-MM-DD when all three are set
  useEffect(() => {
    if (day && month && year) {
      const paddedDay = day.padStart(2, '0');
      onChange(`${year}-${month}-${paddedDay}`);
    }
  }, [day, month, year]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const daysInMonth = month && year
      ? new Date(Number(year), Number(month), 0).getDate()
      : 31;
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [month, year]);

  return (
    <div className="flex gap-2">
      <select
        value={day}
        onChange={(e) => setDay(e.target.value)}
        className={`${selectClass(!!error)} w-[80px]`}
        aria-label="Day"
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={String(d)}>{d}</option>
        ))}
      </select>

      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className={`${selectClass(!!error)} flex-1`}
        aria-label="Month"
      >
        <option value="">Month</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
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
