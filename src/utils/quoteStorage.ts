
export interface Quote {
  id: string;
  adminname: string;
  adminemail: string;
  managementcompany: string | null;
  legalrepresentative: string | null;
  additional_at: Array<{ name: string; email: string }>;
  communityname: string;
  buildingaddress: string | null;
  comuna: string | null;
  region: string | null;
  buildingtype: string;
  units: number;
  presupuesto_aceptado: boolean;
  created_at: string;
  
  // Stored in database
  monto: number | null;
  inversion: number | null;
  por_unidad: number | null;
  
  // Additional fields from database
  fecha_aprobacion_presupuesto: string | null;
  fecha_firma_contrato: string | null;
  fecha_instalacion_equipos: string | null;
  terminos_contrato: string | null;
  legalrepresentativerut: string | null;
  communityrut: string | null;
  communityemail: string | null;
  legalrepresentativephone: string | null;
  equipos_instalados: string | null;
  communityformationdate: string | null;
  
  // For UI state only
  status?: "Enviado" | "Aceptado";
}

export interface AcceptedQuote {
  quoteId: string;
  legalRepresentativeName: string;
  legalRepresentativeRut: string;
  communityRut: string;
  communityEmail: string;
  legalRepresentativePhone: string;
  communityFormationDate: string;
  acceptedAt?: string;
}

// Function to simulate fetching accepted quotes from local storage
export const getAcceptedQuotes = (): AcceptedQuote[] => {
  try {
    const acceptedQuotes = localStorage.getItem('acceptedQuotes');
    return acceptedQuotes ? JSON.parse(acceptedQuotes) : [];
  } catch (error) {
    console.error("Error fetching accepted quotes from local storage:", error);
    return [];
  }
};

// Load accepted quotes (alias for getAcceptedQuotes)
export const loadAcceptedQuotes = (): AcceptedQuote[] => {
  return getAcceptedQuotes();
};

// Function to load quotes from local storage or return empty array
export const loadQuotes = (): Quote[] => {
  try {
    const quotes = localStorage.getItem('quotes');
    return quotes ? JSON.parse(quotes) : [];
  } catch (error) {
    console.error("Error loading quotes from local storage:", error);
    return [];
  }
};

// Function to update a quote
export const updateQuote = (quoteId: string, updates: Partial<Quote>): void => {
  try {
    const quotes = loadQuotes();
    const updatedQuotes = quotes.map(quote => 
      quote.id === quoteId ? { ...quote, ...updates } : quote
    );
    localStorage.setItem('quotes', JSON.stringify(updatedQuotes));
  } catch (error) {
    console.error("Error updating quote:", error);
  }
};

// Add an accepted quote to local storage
export const addAcceptedQuote = (acceptedQuote: AcceptedQuote): AcceptedQuote => {
  // Get existing quotes from local storage
  const existingAcceptedQuotes = getAcceptedQuotes();
  
  // Add timestamp if not present
  const quoteWithTimestamp = {
    ...acceptedQuote,
    acceptedAt: acceptedQuote.acceptedAt || new Date().toISOString()
  };
  
  // Add the new quote 
  existingAcceptedQuotes.push(quoteWithTimestamp);
  
  // Save back to local storage
  localStorage.setItem('acceptedQuotes', JSON.stringify(existingAcceptedQuotes));
  
  return quoteWithTimestamp;
};

// Function to simulate removing an accepted quote from local storage
export const removeAcceptedQuote = (quoteId: string): void => {
  // Get existing quotes from local storage
  const existingAcceptedQuotes = getAcceptedQuotes();
  
  // Filter out the quote to be removed
  const updatedAcceptedQuotes = existingAcceptedQuotes.filter(quote => quote.quoteId !== quoteId);
  
  // Save back to local storage
  localStorage.setItem('acceptedQuotes', JSON.stringify(updatedAcceptedQuotes));
};

// Function to simulate clearing all accepted quotes from local storage
export const clearAcceptedQuotes = (): void => {
  localStorage.removeItem('acceptedQuotes');
};

// Send accepted quote data to a webhook
export const sendAcceptedQuoteToWebhook = async (
  webhookUrl: string,
  acceptedQuote: AcceptedQuote,
  quoteData: Quote
): Promise<boolean> => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors', // Add to handle CORS issues
      body: JSON.stringify({
        quoteId: acceptedQuote.quoteId,
        legalRepresentativeName: acceptedQuote.legalRepresentativeName,
        legalRepresentativeRut: acceptedQuote.legalRepresentativeRut,
        communityRut: acceptedQuote.communityRut,
        communityEmail: acceptedQuote.communityEmail,
        legalRepresentativePhone: acceptedQuote.legalRepresentativePhone,
        communityFormationDate: acceptedQuote.communityFormationDate,
        timestamp: new Date().toISOString()
      }),
    });
    
    // Since we're using no-cors, we won't get a proper response status
    return true;
  } catch (error) {
    console.error('Error sending data to webhook:', error);
    return false;
  }
};
