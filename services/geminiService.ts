import { Expense, User } from '../types';
import { logger } from './loggerService';

interface ParseExpenseOptions {
  text?: string;
  image?: {
    base64Data: string;
    mimeType: string;
  };
  groupMembers: User[];
  existingExpense?: Expense | null;
}

/**
 * Calls our secure serverless function to parse expense details from text and/or an image.
 * The API key is handled securely on the server, not on the client.
 * @param options - The input options containing text, image, members, and existing expense data.
 * @returns A promise that resolves to the parsed JSON object from the AI, or null on error.
 */
export const parseExpenseWithAI = async (
  options: ParseExpenseOptions
): Promise<any | null> => {
  const { text, image, groupMembers, existingExpense } = options;

  if (!text && !image) {
    logger.warn('AI parsing called without text or image.');
    return null;
  }

  try {
    const response = await fetch('/api/parse-expense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        image,
        groupMembers,
        existingExpense,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'An unknown error occurred.' }));
      logger.error(
        `AI service request failed with status ${response.status}:`,
        errorData.error
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error('Network error calling AI service:', error);
    return null;
  }
};
