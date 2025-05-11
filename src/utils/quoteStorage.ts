
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

export interface AcceptedQuote {
  quoteId: string;
  legalRepresentativeRut: string;
  communityRut: string;
  communityEmail: string;
  legalRepresentativePhone: string;
  communityFormationDate: string;
  acceptedAt: string;
}

const QUOTES_STORAGE_KEY = 'kristalina_quotes';
const ACCEPTED_QUOTES_STORAGE_KEY = 'kristalina_accepted_quotes';

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

// Load accepted quotes from localStorage
export const loadAcceptedQuotes = (): AcceptedQuote[] => {
  try {
    const storedAcceptedQuotes = localStorage.getItem(ACCEPTED_QUOTES_STORAGE_KEY);
    if (storedAcceptedQuotes) {
      return JSON.parse(storedAcceptedQuotes);
    }
  } catch (error) {
    console.error('Error loading accepted quotes from storage:', error);
  }
  return [];
};

// Save accepted quotes to localStorage
export const saveAcceptedQuotes = (acceptedQuotes: AcceptedQuote[]): void => {
  try {
    localStorage.setItem(ACCEPTED_QUOTES_STORAGE_KEY, JSON.stringify(acceptedQuotes));
  } catch (error) {
    console.error('Error saving accepted quotes to storage:', error);
  }
};

// Add a new accepted quote
export const addAcceptedQuote = (acceptedQuoteData: Omit<AcceptedQuote, 'acceptedAt'>): AcceptedQuote => {
  const acceptedQuotes = loadAcceptedQuotes();
  
  const newAcceptedQuote: AcceptedQuote = {
    ...acceptedQuoteData,
    acceptedAt: new Date().toISOString(),
  };
  
  acceptedQuotes.push(newAcceptedQuote);
  saveAcceptedQuotes(acceptedQuotes);
  
  // Also update the original quote status
  updateQuote(acceptedQuoteData.quoteId, { status: "Aceptado" });
  
  return newAcceptedQuote;
};

// Send accepted quote data to webhook
export const sendAcceptedQuoteToWebhook = async (
  webhookUrl: string, 
  acceptedQuote: AcceptedQuote, 
  quoteData: Quote
): Promise<boolean> => {
  try {
    if (!webhookUrl) {
      console.error('No webhook URL provided');
      return false;
    }
    
    const payload = {
      ...acceptedQuote,
      quoteData: {
        communityName: quoteData.communityName,
        buildingAddress: quoteData.buildingAddress,
        comuna: quoteData.comuna,
        region: quoteData.region,
        buildingType: quoteData.buildingType,
        units: quoteData.units,
        quoteAmount: quoteData.quoteAmount,
        investmentValue: quoteData.investmentValue,
        adminName: quoteData.adminName,
        adminEmail: quoteData.adminEmail,
      },
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors', // Using no-cors to handle CORS issues
    });
    
    return true;
  } catch (error) {
    console.error('Error sending data to webhook:', error);
    return false;
  }
};
