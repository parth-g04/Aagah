const API_URL = 'https://api.data.gov.in/resource/bd3890fa-8338-4d68-a834-b65acdb2f6a0';

// Robust local fallback dataset populated with real NITI Aayog values
const FALLBACK_DATA = [
  { crop: 'Rice', values: [100, 101, 99, 105, 112, 121, 117, 110] },
  { crop: 'Wheat', values: [100, 101, 112, 115, 117, 127, 120, 108] },
  { crop: 'Coarse Cereals', values: [100, 107, 110, 115, 113, 123, 122, 136] },
  { crop: 'Pulses', values: [100, 108, 134, 124, 124, 146, 137, 129] },
  { crop: 'Vegetables', values: [100, 109, 103, 118, 113, 124, 128, 115] },
  { crop: 'Fruits', values: [100, 99, 99, 98, 102, 104, 114, 119] },
  { crop: 'Milk', values: [100, 97, 98, 98, 98, 112, 123, 124] },
  { crop: 'Eggs, Fish and Meat', values: [100, 102, 101, 100, 99, 116, 133, 137] },
  { crop: 'Oilseeds', values: [100, 86, 85, 97, 104, 103, 99, 102] },
  { crop: 'Sugarcane', values: [100, 96, 91, 87, 80, 81, 109, 107] }
].map(item => ({
  ...item,
  years: ['2004-05', '2005-06', '2006-07', '2007-08', '2008-09', '2009-10', '2010-11', '2011-12']
}));

async function fetchMarketTrends() {
  const apiKey = process.env.MARKET_API_KEY;
  if (!apiKey) {
    console.warn('[Market Service] MARKET_API_KEY is not defined. Using local fallback data.');
    return FALLBACK_DATA;
  }

  const url = `${API_URL}?api-key=${apiKey}&format=json&limit=15`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.records && data.records.length > 0) {
        return data.records
          .filter(record => record.crop && record.crop !== 'NA' && !record.crop.includes('comprises') && record.__2004_05 && parseFloat(record.__2004_05) > 0)
          .map(record => {
            const years = ['2004-05', '2005-06', '2006-07', '2007-08', '2008-09', '2009-10', '2010-11', '2011-12'];
            const values = [
              parseFloat(record.__2004_05 || 100),
              parseFloat(record.__2005_06 || 100),
              parseFloat(record.__2006_07 || 100),
              parseFloat(record.__2007_08 || 100),
              parseFloat(record.__2008_09 || 100),
              parseFloat(record.__2009_10 || 100),
              parseFloat(record.__2010_11 || 100),
              parseFloat(record.__2011_12 || 100)
            ];
            return {
              crop: record.crop,
              years,
              values
            };
          });
      }

    } else {
      const errText = await response.text();
      console.error(`[Market Service] API error (status ${response.status}):`, errText);
    }
  } catch (err) {
    console.error('[Market Service] Failed to query market index API:', err.message);
  }

  console.log('[Market Service] Returning local fallback WPI datasets.');
  return FALLBACK_DATA;
}

module.exports = {
  fetchMarketTrends
};
