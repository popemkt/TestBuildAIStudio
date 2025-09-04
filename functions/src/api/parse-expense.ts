import * as express from 'express';
import { handleParseExpense } from '../../../services/aiParsingService';
import { logger } from '../../../services/loggerService';

export default async (req: express.Request, res: express.Response) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body;
    const parsedJson = await handleParseExpense(body);

    return res.status(200).json(parsedJson);
  } catch (error: any) {
    logger.error("Error in serverless function 'parse-expense':", error);

    const errorMessage = error.message.includes('API_KEY')
      ? 'AI service is not configured on the server. The API_KEY is missing.'
      : 'An error occurred while processing your request.';
    const statusCode = error.message.includes('API_KEY') ? 500 : 500;

    return res.status(statusCode).json({
      error: errorMessage,
    });
  }
};
