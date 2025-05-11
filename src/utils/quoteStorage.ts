
// Utility for storing and retrieving quotes data

export interface Quote {
  id: string;
  communityName: string;
  buildingAddress: string;
  comuna: string;
  buildingType: string;
  units: number;
  quoteAmount: number;
  quotePerUnit: number;
  investmentValue: number;
  status: "Enviado" | "Aceptado";
  region: string;
  adminName: string;
  adminEmail: string;
  managementCompany: string;
  legalRepresentative: string;
}

const QUOTES_STORAGE_KEY = 'kristalina_quotes';

// Load quotes from localStorage
export const loadQuotes = (): Quote[] => {
  try {
    const storedQuotes = localStorage.getItem(QUOTES_STORAGE_KEY);
    if (storedQuotes) {
      return JSON.parse(storedQuotes);
    }
  } catch (error) {
    console.error('Error loading quotes from storage:', error);
  }
  return [];
};

// Save quotes to localStorage
export const saveQuotes = (quotes: Quote[]): void => {
  try {
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
  } catch (error) {
    console.error('Error saving quotes to storage:', error);
  }
};

// Add a new quote
export const addQuote = (quoteData: Omit<Quote, 'id' | 'quoteAmount' | 'quotePerUnit' | 'investmentValue' | 'status'>): void => {
  const quotes = loadQuotes();
  
  // Generate a random ID
  const id = Date.now().toString();
  
  // Calculate default values
  const baseAmount = 50000; // Base amount per unit in CLP
  const units = quoteData.units || 0;
  const quotePerUnit = baseAmount;
  const quoteAmount = units * quotePerUnit;
  const investmentValue = Math.round(quoteAmount * 0.8); // 80% of quote amount as default investment value
  
  const newQuote: Quote = {
    ...quoteData,
    id,
    quoteAmount,
    quotePerUnit,
    investmentValue,
    status: "Enviado",
  };
  
  quotes.push(newQuote);
  saveQuotes(quotes);
};

// Update an existing quote
export const updateQuote = (id: string, updatedData: Partial<Quote>): void => {
  const quotes = loadQuotes();
  const index = quotes.findIndex(quote => quote.id === id);
  
  if (index !== -1) {
    quotes[index] = { ...quotes[index], ...updatedData };
    saveQuotes(quotes);
  }
};

// Delete a quote
export const deleteQuote = (id: string): void => {
  const quotes = loadQuotes();
  const filteredQuotes = quotes.filter(quote => quote.id !== id);
  saveQuotes(filteredQuotes);
};
