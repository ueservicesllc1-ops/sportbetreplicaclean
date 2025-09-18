
'use server'

const API_KEY = process.env.THE_ODDS_API_KEY;
const API_URL = 'https://api.the-odds-api.com/v4/sports';

if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    console.warn('THE_ODDS_API_KEY is not set in .env file. Using placeholder data. Get a free key from https://the-odds-api.com/');
}

export async function getSportsOdds(sportKey: string) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
        // throw new Error('La clave API para The Odds API no está configurada. Por favor, establece THE_ODDS_API_KEY en tu archivo .env. Puedes obtener una clave gratuita en https://the-odds-api.com/');
        console.error('THE_ODDS_API_KEY is not set. Returning empty array.');
        return [];
    }
  
  const url = `${API_URL}/${sportKey}/odds?regions=us&markets=h2h&oddsFormat=decimal&apiKey=${API_KEY}`;
  
  try {
    const response = await fetch(url, {
        next: { revalidate: 300 } // Revalidate every 5 minutes
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch(e) {
        // Not a json response
      }
      console.error('API Error:', errorData);
      throw new Error(`Error de API: ${errorData?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch sports odds:', error);
    if (error instanceof Error && error.message.startsWith('Error de API:')) {
        throw error;
    }
    throw new Error('No se pudieron obtener los datos de The Odds API.');
  }
}
