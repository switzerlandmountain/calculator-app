import React from 'react';
import { Currency } from '../types/currency';
import { currencies } from '../data/currencies';

interface Props {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export const CurrencySelect: React.FC<Props> = ({ value, onChange, label }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border-none bg-[#1F2943] px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 font-medium text-sm"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} - {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
}
