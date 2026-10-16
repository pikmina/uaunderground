import React from "react";
import { Calendar } from "lucide-react";
import { Label } from "./ui/label";

export const MONTHS_LIST = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

interface IcDatePickerProps {
  value: string; // The formatted string, e.g. "15 de Julio, 2201" or "Julio de 2201"
  onChange: (formatted: string) => void;
  defaultMonth?: string;
  defaultYear?: string | number;
  label?: string;
}

export const IcDatePicker: React.FC<IcDatePickerProps> = ({
  value,
  onChange,
  defaultMonth = "Julio",
  defaultYear = "2201",
  label = "Fecha de Juego",
}) => {
  // Parse value if possible, or build local state
  const [day, setDay] = React.useState<string>(() => {
    const match = value?.match(/^(\d{1,2})\s+de/i);
    return match ? match[1] : "";
  });

  const [month, setMonth] = React.useState<string>(() => {
    const foundMonth = MONTHS_LIST.find((m) => value?.toLowerCase().includes(m.toLowerCase()));
    return foundMonth || defaultMonth || "Julio";
  });

  const [year, setYear] = React.useState<string>(() => {
    const match = value?.match(/\b(2\d{3})\b/);
    return match ? match[1] : String(defaultYear || "2201");
  });

  // Whenever day, month, or year changes, emit formatted string
  const updateFormatted = (d: string, m: string, y: string) => {
    const cleanDay = d.trim();
    const cleanMonth = m.trim() || defaultMonth || "Julio";
    const cleanYear = y.trim() || String(defaultYear || "2201");

    let formatted = "";
    if (cleanDay) {
      formatted = `${cleanDay} de ${cleanMonth}, ${cleanYear}`;
    } else {
      formatted = `${cleanMonth} de ${cleanYear}`;
    }
    onChange(formatted);
  };

  return (
    <div className="space-y-1 bg-amber-50/80 border-2 border-black rounded-lg p-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-black uppercase tracking-tight text-amber-950 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span>{label}</span>
        </Label>
        <span className="text-[10px] font-black uppercase bg-amber-300 text-black px-1.5 py-0.5 rounded border border-black">
          Fecha: {value || `${defaultMonth} de ${defaultYear}`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 pt-1">
        {/* Day */}
        <div>
          <span className="text-[10px] font-bold text-zinc-600 block mb-0.5">Día (opcional)</span>
          <select
            value={day}
            onChange={(e) => {
              const newDay = e.target.value;
              setDay(newDay);
              updateFormatted(newDay, month, year);
            }}
            className="w-full h-8 rounded border-2 border-black bg-white text-xs font-bold px-1 cursor-pointer focus:outline-none"
          >
            <option value="">(Todo el mes)</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d)}>
                Día {d}
              </option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div>
          <span className="text-[10px] font-bold text-zinc-600 block mb-0.5">Mes</span>
          <select
            value={month}
            onChange={(e) => {
              const newMonth = e.target.value;
              setMonth(newMonth);
              updateFormatted(day, newMonth, year);
            }}
            className="w-full h-8 rounded border-2 border-black bg-white text-xs font-bold px-1 cursor-pointer focus:outline-none"
          >
            {MONTHS_LIST.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <span className="text-[10px] font-bold text-zinc-600 block mb-0.5">Año</span>
          <input
            type="text"
            value={year}
            onChange={(e) => {
              const newYear = e.target.value;
              setYear(newYear);
              updateFormatted(day, month, newYear);
            }}
            placeholder="2201"
            className="w-full h-8 rounded border-2 border-black bg-white text-xs font-bold px-2 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
