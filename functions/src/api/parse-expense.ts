import { handleParseExpense } from '../../../services/aiParsingService';
import { logger } from '../../../services/loggerService';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const parsedJson = await handleParseExpense(body);

    return new Response(JSON.stringify(parsedJson), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error("Error in serverless function 'parse-expense':", error);

    const errorMessage = error.message.includes('API_KEY')
      ? 'AI service is not configured on the server. The API_KEY is missing.'
      : 'An error occurred while processing your request.';
    const statusCode = error.message.includes('API_KEY') ? 500 : 500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};