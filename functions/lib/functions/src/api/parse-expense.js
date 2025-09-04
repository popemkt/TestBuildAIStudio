"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aiParsingService_1 = require("../../../services/aiParsingService");
const loggerService_1 = require("../../../services/loggerService");
exports.default = async (req) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    try {
        const body = await req.json();
        const parsedJson = await (0, aiParsingService_1.handleParseExpense)(body);
        return new Response(JSON.stringify(parsedJson), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    catch (error) {
        loggerService_1.logger.error("Error in serverless function 'parse-expense':", error);
        const errorMessage = error.message.includes('API_KEY')
            ? 'AI service is not configured on the server. The API_KEY is missing.'
            : 'An error occurred while processing your request.';
        const statusCode = error.message.includes('API_KEY') ? 500 : 500;
        return new Response(JSON.stringify({
            error: errorMessage,
        }), {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
//# sourceMappingURL=parse-expense.js.map