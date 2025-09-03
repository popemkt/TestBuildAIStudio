/**
 * Enhanced form components using React Hook Form with Zod validation
 * Provides type-safe, performant form handling with automatic validation
 */

import React from 'react';
import { useForm, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from './common/Input';
import Button from './common/Button';

type FormSchema = z.ZodObject<any>;

type FormProps<T extends FormSchema> = {
  schema: T;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  defaultValues?: Partial<z.infer<T>>;
  submitText?: string;
  isLoading?: boolean;
  children: (methods: {
    control: any;
    formState: { errors: any; isSubmitting: boolean };
    handleSubmit: any;
  }) => React.ReactNode;
};

export function ValidatedForm<T extends FormSchema>({
  schema,
  onSubmit,
  defaultValues,
  submitText = 'Submit',
  isLoading = false,
  children,
}: FormProps<T>) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onBlur', // Validate on blur for better UX
  });

  const handleFormSubmit = (data: FieldValues) => {
    onSubmit(data as z.infer<T>);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {children({ control, formState: { errors, isSubmitting }, handleSubmit })}

      <Button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="w-full"
      >
        {isSubmitting || isLoading ? 'Loading...' : submitText}
      </Button>
    </form>
  );
}

type ValidatedInputProps = {
  control: any;
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  errors: any;
  disabled?: boolean;
  className?: string;
};

export function ValidatedInput({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  errors,
  disabled = false,
  className,
}: ValidatedInputProps) {
  const error = errors[name]?.message;

  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            id={name}
            label={label}
            placeholder={placeholder}
            type={type}
            disabled={disabled}
            className={
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : ''
            }
          />
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

type ValidatedSelectProps = {
  control: any;
  name: string;
  label?: string;
  options: { value: string; label: string }[];
  errors: any;
  disabled?: boolean;
  className?: string;
};

export function ValidatedSelect({
  control,
  name,
  label,
  options,
  errors,
  disabled = false,
  className,
}: ValidatedSelectProps) {
  const error = errors[name]?.message;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            disabled={disabled}
            className={`w-full rounded-md border bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100 ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default ValidatedForm;
