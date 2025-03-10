import React from 'react';
import { TableCell } from "@/components/ui/table";

interface ForecastTableCellProps {
  isEditable: boolean;
  isRealized: boolean;
  shouldBeYellow: boolean;
  value: number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  bgColor?: string;
}

export const ForecastTableCell: React.FC<ForecastTableCellProps> = ({
  isEditable,
  isRealized,
  shouldBeYellow,
  value,
  onChange,
  onBlur,
  bgColor = 'bg-white'
}) => {
  const displayValue = value === 0 ? "-" : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <TableCell 
      className={`text-right p-0 border-r border-slate-200 w-[100px] min-w-[100px] text-[1.15rem] text-black
        ${shouldBeYellow ? 'bg-yellow-50' : bgColor}
        ${isEditable && !isRealized ? 'bg-blue-50' : ''}
      `}
    >
      {isEditable && !isRealized ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          className="w-full h-8 py-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-blue-400 focus:outline-none px-3 transition-all text-[1.15rem] text-black"
        />
      ) : (
        <div className="py-1 px-3 text-black">
          {displayValue}
        </div>
      )}
    </TableCell>
  );
};