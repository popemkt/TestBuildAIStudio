import express from 'express';
import bodyParser from 'body-parser';
import { handleParseExpense } from '../services/aiParsingService';
import { logger } from '../services/loggerService';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const port = 3001;

// Use body-parser to handle large base64 image strings
app.use(bodyParser.json({ limit: '10mb' }));

// FIX: Added explicit types for req and res to solve overload error.
app.post('/api/parse-expense', async (req: express.Request, res: express.Response) => {
  try {
    const options = req.body;
    const result = await handleParseExpense(options);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error("Error in local dev server '/api/parse-expense':", error);

    const errorMessage = error.message.includes('API_KEY')
      ? 'AI service is not configured. Make sure the API_KEY environment variable is set.'
      : 'An error occurred while processing your request.';
    const statusCode = error.message.includes('API_KEY') ? 500 : 500;

    res.status(statusCode).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  logger.info(
    `[server]: Local API server is running at http://localhost:${port}`
  );
});
