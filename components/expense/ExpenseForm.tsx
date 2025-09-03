import React from 'react';
import { CURRENCIES } from '../../constants/currencies';
import Input from '../common/Input';
import Spinner from '../common/Spinner';

interface ExpenseFormProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  amount: number;
  onAmountChange: (value: number) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  disabled?: boolean;
  errors?: {
    description?: string;
    amount?: string;
    date?: string;
  };
  isConverting?: boolean;
  conversionRate?: number | null;
  convertedAmount?: number;
  masterCurrency?: string;
  aiFilledFields?: Set<string>;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  description,
  onDescriptionChange,
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  date,
  onDateChange,
  disabled = false,
  errors,
  aiFilledFields = new Set(),
  isConverting = false,
  conversionRate = null,
  convertedAmount,
  masterCurrency,
}) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onAmountChange(value);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        className={aiFilledFields.has('description') ? 'ai-highlight' : ''}
        required
        disabled={disabled}
      />
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className={aiFilledFields.has('date') ? 'ai-highlight' : ''}
        required
        disabled={disabled}
      />

      <div>
        <div className="flex gap-2">
          <Input
            label="Amount"
            type="number"
            value={amount || ''}
            onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
            required
            placeholder="0.00"
            step="0.01"
            containerClassName="flex-grow"
            className={aiFilledFields.has('amount') ? 'ai-highlight' : ''}
            disabled={disabled}
          />
          <div className="flex w-28 flex-col justify-end">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              disabled={disabled}
              className={`h-full w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 ${aiFilledFields.has('amount') ? 'ai-highlight' : ''}`}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Container to hold conversion status, preventing layout shift */}
        <div className="mt-1 flex h-8 items-center">
          {isConverting ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Spinner size="w-4 h-4" />
              <span>Converting...</span>
            </div>
          ) : conversionRate != null &&
            masterCurrency &&
            currency !== masterCurrency ? (
            <div className="w-full rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
              1 {currency} = {conversionRate.toFixed(4)} {masterCurrency}.
              Total:
              <span className="font-semibold">
                {' '}
                {(convertedAmount ?? amount * conversionRate).toFixed(2)}{' '}
                {masterCurrency}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
