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
  
  // For UI state only
  status?: "Enviado" | "Aceptado";
}

export interface AcceptedQuote {
  quoteId: string;
  legalRepresentativeName: string; // Added this field
  legalRepresentativeRut: string;
  communityRut: string;
  communityEmail: string;
  legalRepresentativePhone: string;
  communityFormationDate: string;
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

// Add an accepted quote to local storage
export const addAcceptedQuote = (acceptedQuote: AcceptedQuote): AcceptedQuote => {
  // Get existing quotes from local storage
  const existingAcceptedQuotes = getAcceptedQuotes();
  
  // Add the new quote 
  existingAcceptedQuotes.push(acceptedQuote);
  
  // Save back to local storage
  localStorage.setItem('acceptedQuotes', JSON.stringify(existingAcceptedQuotes));
  
  return acceptedQuote;
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
