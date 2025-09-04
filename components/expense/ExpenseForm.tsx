import React from 'react';
import { CURRENCIES } from '../../constants/currencies';
import Input from '../common/Input';
import Spinner from '../common/Spinner';
import { ICONS } from '../../constants';

interface ExpenseFormProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  amount: number;
  onAmountChange: (value: number) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
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
  location,
  onLocationChange,
  onDetectLocation,
  isDetectingLocation,
  disabled = false,
  errors,
  aiFilledFields = new Set(),
  isConverting = false,
  conversionRate = null,
  convertedAmount,
  masterCurrency,
}) => {
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

      <div className="flex items-start gap-2">
        <div className="relative flex-grow">
          <Input
            label="Location (Optional)"
            id="location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className={`${
              aiFilledFields.has('location') ? 'ai-highlight' : ''
            } pr-12`}
            disabled={disabled}
            placeholder="e.g. Starbucks, 5th Ave"
          />
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={disabled || isDetectingLocation}
            className="absolute right-2 top-8 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-slate-700"
            aria-label="Detect current location"
          >
            {isDetectingLocation ? (
              <Spinner size="w-5 h-5" />
            ) : (
              <ICONS.LOCATION className="h-5 w-5" />
            )}
          </button>
        </div>
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className={aiFilledFields.has('date') ? 'ai-highlight' : ''}
          containerClassName="w-44 flex-shrink-0"
          required
          disabled={disabled}
        />
      </div>

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
          <div className="w-28">
            <label
              htmlFor="currency"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>
        {isConverting && (
          <p className="mt-1 animate-pulse text-xs text-gray-500">
            Converting...
          </p>
        )}
        {conversionRate && masterCurrency && (
          <p className="mt-1 text-xs text-gray-500">
            ~{convertedAmount?.toFixed(2)} {masterCurrency} (1 {currency} ={' '}
            {conversionRate.toFixed(4)} {masterCurrency})
          </p>
        )}
      </div>
    </div>
  );
};

export default ExpenseForm;
