import { GoogleGenAI, Type } from '@google/genai';
import { Expense, User } from '../types';
import { logger } from './loggerService';

/**
 * Defines the JSON schema for the expected AI model output.
 * This schema is dynamic: for new expenses, 'description' and 'amount' are required,
 * but for edits, no fields are required, as the user might only be changing one detail.
 * @param isEditMode - Boolean indicating if we are editing an existing expense.
 * @returns The JSON schema object for Gemini.
 */
const getExpenseSchema = (isEditMode: boolean) => ({
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: 'A brief description of the expense.',
    },
    amount: {
      type: Type.NUMBER,
      description: 'The total amount of the expense.',
    },
    currency: {
      type: Type.STRING,
      description:
        'The 3-letter ISO currency code for the amount (e.g., USD, EUR, JPY). If not specified, do not include this field.',
    },
    category: {
      type: Type.STRING,
      description:
        'A suitable category for the expense (e.g., food, transport, groceries, entertainment). If unsure, do not include this field.',
    },
    date: {
      type: Type.STRING,
      description:
        'The date of the expense in YYYY-MM-DD format. If a date is mentioned, use it. If unsure or no date is mentioned, do not include this field.',
    },
    paidBy: {
      type: Type.STRING,
      description:
        'The name of the person from the provided list of members who paid for the expense. If not specified, do not include this field.',
    },
    split: {
      type: Type.OBJECT,
      description:
        'Details on how the expense is split among participants. If not explicitly mentioned how to split, do not include this field.',
      properties: {
        type: {
          type: Type.STRING,
          enum: ['EQUAL', 'EXACT', 'PARTS'],
          description:
            "The method of splitting the bill. 'EQUAL' for equal shares. 'EXACT' when specific amounts are given. 'PARTS' when shares/portions are described (e.g., 'I paid for me and Bob').",
        },
        participants: {
          type: Type.ARRAY,
          description:
            'A list of participants involved in the split. Only include members from the provided list of names.',
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description:
                  'The name of the participant, must be from the provided list of group members.',
              },
              amount: {
                type: Type.NUMBER,
                description:
                  "The exact amount owed by the participant. Only use for 'EXACT' split type.",
              },
              parts: {
                type: Type.INTEGER,
                description:
                  "The number of parts/shares for the participant. Only use for 'PARTS' split type.",
              },
            },
            required: ['name'],
          },
        },
      },
      required: ['type', 'participants'],
    },
  },
  // If editing, no fields are required. If creating, description and amount are.
  required: isEditMode ? [] : ['description', 'amount'],
});

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
 * Constructs the prompt text sent to the Gemini model.
 * @param options - The input options containing text, image, members, and existing expense data.
 * @returns A string representing the complete prompt for the AI.
 */
const generatePrompt = (options: ParseExpenseOptions) => {
  const { text, image, groupMembers, existingExpense } = options;
  const memberNames = groupMembers.map((m) => m.name).join(', ');

  if (existingExpense) {
    let prompt = `You are editing an existing expense. Here are the current details: ${JSON.stringify(
      existingExpense
    )}. The members in the group are: ${memberNames}. Your name is 'You'.`;
    if (text)
      prompt += ` The user wants to make the following changes: "${text}".`;
    prompt += ` IMPORTANT: Only return fields for the details that need to be changed based on the user's request. If a detail from the existing expense is not mentioned or found, do not include it in your response. If a currency symbol or code is present, extract it as a 3-letter ISO code.`;
    return prompt;
  }

  let prompt = `Parse the provided text and/or image to extract expense details. The members in the group are: ${memberNames}. Your name is 'You'.`;
  if (text) prompt += ` Here is the text provided by the user: "${text}".`;
  prompt += ` Analyze the information to determine the description, total amount and its currency (as a 3-letter ISO code), date, a suitable category, who paid, and how the bill is split. For example, 'split with Alice' means an EQUAL split between You and Alice. 'Alice owes $10' implies an EXACT split. 'I paid for my part and Bob's' implies a PARTS split where you have 2 parts. The current date is ${
    new Date().toISOString().split('T')[0]
  }. Only return fields you are confident about. If split information isn't clear, do not return a 'split' object.`;
  return prompt;
};

export const handleParseExpense = async (options: ParseExpenseOptions) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.error(
      'SERVER-SIDE ERROR: API_KEY environment variable is not set.'
    );
    throw new Error('API_KEY'); // Throw specific error to be caught by handlers
  }

  const isEditMode = !!options.existingExpense;
  const promptText = generatePrompt(options);
  const ai = new GoogleGenAI({ apiKey });

  const parts = [];
  if (options.image) {
    parts.push({
      inlineData: {
        data: options.image.base64Data,
        mimeType: options.image.mimeType,
      },
    });
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: getExpenseSchema(isEditMode),
    },
  });

  const jsonString = response.text;
  return JSON.parse(jsonString);
};
