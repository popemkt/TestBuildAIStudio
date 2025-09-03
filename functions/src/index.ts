import * as functions from 'firebase-functions';
import * as express from 'express';
import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase-admin';
import handleParseExpense from './api/parse-expense';

initializeApp();

const app = express();

// We need to parse the body of the request
app.use(express.json());

// Your API route
app.post('/parse-expense', handleParseExpense);

// This exports the express app as a single Cloud Function named 'api'.
// The resulting endpoint will be something like: 
// https://us-central1-your-project-id.cloudfunctions.net/api/parse-expense
export const api = functions.https.onRequest(app);
