// In a real application, this would call an actual currency conversion API.
// For this demo, we are mocking the response with static rates.
// All rates are relative to a base currency (USD) to allow conversion between any two supported currencies.

const MOCK_RATES: { [key: string]: number } = {
  // Rates relative to USD
  USD: 1.0,
  EUR: 0.92,
  JPY: 157.0,
  GBP: 0.78,
  AUD: 1.5,
  CAD: 1.37,
  CHF: 0.89,
  CNY: 7.25,
  INR: 83.5,
  BRL: 5.4,
  VND: 25000,
};

/**
 * Simulates fetching an exchange rate between two currencies.
 * @param fromCurrency The currency code to convert from (e.g., 'JPY').
 * @param toCurrency The currency code to convert to (e.g., 'USD').
 * @returns A promise that resolves to the conversion rate, or null if a currency is not found.
 */
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> => {
  // Simulate fetching exchange rate
  await new Promise((resolve) => setTimeout(resolve, 300));

  const fromRate = MOCK_RATES[fromCurrency];
  const toRate = MOCK_RATES[toCurrency];

  if (!fromRate || !toRate) {
    return null; // Currency not found
  }

  // The conversion logic: convert the 'from' currency to the base currency (USD),
  // then convert from USD to the 'to' currency.
  const rate = (1 / fromRate) * toRate;

  return rate;
};
