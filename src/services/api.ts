import axios from 'axios';

const BASE_URL = 'https://open.er-api.com/v6/latest';

export const getExchangeRate = async (from: string, to: string): Promise<{ rate: number; timestamp: Date }> => {
  try {
    const response = await axios.get(`${BASE_URL}/${from}`);
    
    if (!response.data.rates || !response.data.rates[to]) {
      throw new Error(`Could not find rate for ${to}`);
    }

    return {
      rate: response.data.rates[to],
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Return a fallback rate of 1 in case of error
    return {
      rate: 1,
      timestamp: new Date()
    };
  }
};
