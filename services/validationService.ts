/**
 * Validation service for SplitSmart AI application
 * Uses Zod for type-safe schema validation
 */

import { z } from 'zod';
import { CURRENCIES } from '../constants/currencies';

// Get supported currency codes
const supportedCurrencies = CURRENCIES.map((c) => c.code) as [
  string,
  ...string[],
];

// Currency amount validation with decimal place rules
const createCurrencyAmountSchema = (currency?: string) => {
  const isZeroDecimalCurrency =
    currency && ['JPY', 'KRW', 'VND', 'IDR'].includes(currency);

  let schema = z
    .number({
      message: 'Please enter a valid number',
    })
    .positive('Amount must be greater than zero')
    .max(1000000000, 'Amount is too large (maximum: 1 billion)');

  if (isZeroDecimalCurrency) {
    schema = schema.int(`${currency} does not support decimal places`);
  } else {
    // Check for max 2 decimal places
    schema = schema.refine((val) => {
      const decimalPart = val.toString().split('.')[1];
      return !decimalPart || decimalPart.length <= 2;
    }, 'Amount cannot have more than 2 decimal places');
  }

  return schema;
};

// File validation schema
export const fileSchema = z.object({
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    message: 'File type must be JPEG, PNG, WebP, or GIF',
  }),
  name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name is too long')
    .refine(
      (name) =>
        !name.includes('..') && !name.includes('/') && !name.includes('\\'),
      'Invalid file name'
    )
    .refine((name) => {
      const ext = name.toLowerCase();
      return (
        ext.endsWith('.jpg') ||
        ext.endsWith('.jpeg') ||
        ext.endsWith('.png') ||
        ext.endsWith('.webp') ||
        ext.endsWith('.gif')
      );
    }, 'File must have a valid image extension'),
});

// Core validation schemas
export const currencyCodeSchema = z.enum(supportedCurrencies, {
  message: 'Currency is not supported',
});

export const descriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .min(2, 'Description must be at least 2 characters')
  .max(200, 'Description cannot exceed 200 characters')
  .refine((desc) => {
    const suspiciousPatterns = [/<script|javascript:|data:|vbscript:/i];
    return !suspiciousPatterns.some((pattern) => pattern.test(desc));
  }, 'Description contains invalid content');

export const dateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine((dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }, 'Please enter a valid date')
  .refine((dateStr) => {
    const date = new Date(dateStr);
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    return date >= tenYearsAgo;
  }, 'Date cannot be more than 10 years in the past')
  .refine((dateStr) => {
    const date = new Date(dateStr);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return date <= oneYearFromNow;
  }, 'Date cannot be more than 1 year in the future');

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(100, 'Email address is too long');

export const groupNameSchema = z
  .string()
  .min(1, 'Group name is required')
  .min(2, 'Group name must be at least 2 characters')
  .max(50, 'Group name cannot exceed 50 characters')
  .trim();

export const userNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(
    /^[a-zA-Z\s\-'\.]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  )
  .trim();

export const tagsSchema = z
  .string()
  .max(200, 'Tags cannot exceed 200 characters')
  .optional()
  .refine((tags) => {
    if (!tags) return true;
    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    return tagArray.length <= 10;
  }, 'Cannot have more than 10 tags')
  .refine((tags) => {
    if (!tags) return true;
    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    return tagArray.every((tag) => tag.length <= 30);
  }, 'Each tag cannot exceed 30 characters');

// Complex form schemas
export const expenseFormSchema = z
  .object({
    description: descriptionSchema,
    originalAmount: z.number().gt(0, 'Amount must be greater than zero'),
    originalCurrency: currencyCodeSchema,
    date: dateSchema,
    groupId: z.string().min(1, 'Please select a group'),
    participants: z
      .array(z.string())
      .min(1, 'At least one participant is required'),
    tags: tagsSchema,
  })
  .refine(
    (data) => {
      // Validate amount with currency context
      const schema = createCurrencyAmountSchema(data.originalCurrency);
      return schema.safeParse(data.originalAmount).success;
    },
    {
      message: 'Invalid amount for selected currency',
      path: ['originalAmount'],
    }
  );

export const groupCreationSchema = z.object({
  name: groupNameSchema,
  currency: currencyCodeSchema,
  memberIds: z.array(z.string()).min(2, 'Group must have at least 2 members'),
});

export const userProfileSchema = z.object({
  name: userNameSchema,
  email: emailSchema.optional(),
});

// Export validation functions for easier use
export const validateFile = (file: File) => {
  return fileSchema.safeParse({
    size: file.size,
    type: file.type,
    name: file.name,
  });
};

export const validateExpenseForm = (data: unknown) => {
  return expenseFormSchema.safeParse(data);
};

export const validateGroupCreation = (data: unknown) => {
  return groupCreationSchema.safeParse(data);
};

export const validateUserProfile = (data: unknown) => {
  return userProfileSchema.safeParse(data);
};

// Legacy exports for backward compatibility
export const ValidationService = {
  validateCurrencyAmount: (amount: number, currency?: string) => {
    const result = createCurrencyAmountSchema(currency).safeParse(amount);
    return {
      isValid: result.success,
      error: result.success ? undefined : result.error.issues[0]?.message,
    };
  },
  validateCurrencyCode: (code: string) => {
    const result = currencyCodeSchema.safeParse(code);
    return {
      isValid: result.success,
      error: result.success ? undefined : result.error.issues[0]?.message,
    };
  },
  validateDescription: (desc: string) => {
    const result = descriptionSchema.safeParse(desc);
    return {
      isValid: result.success,
      error: result.success ? undefined : result.error.issues[0]?.message,
    };
  },
  validateDate: (date: string) => {
    const result = dateSchema.safeParse(date);
    return {
      isValid: result.success,
      error: result.success ? undefined : result.error.issues[0]?.message,
    };
  },
  validateEmail: (email: string) => {
    const result = emailSchema.safeParse(email);
    return {
      isValid: result.success,
      error: result.success ? undefined : result.error.issues[0]?.message,
    };
  },
  validateGroupName: (name: string) => {
    const result = groupNameSchema.safeParse(name);
    return {
      isValid: result.success,
      error: result.success ? undefined : result.error.issues[0]?.message,
    };
  },
};

// For backward compatibility
export const validateAmount = ValidationService.validateCurrencyAmount;
export const validateDescription = ValidationService.validateDescription;
export const validateDate = ValidationService.validateDate;
export const validateEmail = ValidationService.validateEmail;
export const validateGroupName = ValidationService.validateGroupName;
export const validateUserName = (name: string) => {
  const result = userNameSchema.safeParse(name);
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.issues[0]?.message,
  };
};
export const validateTags = (tags: string) => {
  const result = tagsSchema.safeParse(tags);
  return {
    isValid: result.success,
    error: result.success ? undefined : result.error.issues[0]?.message,
  };
};

export default ValidationService;
