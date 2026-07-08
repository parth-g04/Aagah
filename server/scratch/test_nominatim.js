async function testOverpass() {
  const lat = 21.1458;
  const lng = 79.0882;
  
  // Overpass QL query: find up to 20 cities, towns, suburbs or villages within 30km (30000 meters)
  const query = `[out:json];(
    node(around:30000, ${lat}, ${lng})["place"~"town|village|suburb|city"];
    way(around:30000, ${lat}, ${lng})["place"~"town|village|suburb|city"];
  );
  out center 20;`;
  
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  try {
    console.log('Sending query to Overpass API...');
    const headers = { 'User-Agent': 'Aagah-Agri-Dashboard-Agent-v2' };
    const res = await fetch(url, { headers });
    console.log('Overpass API status:', res.status);
    const text = await res.text();
    console.log('Raw output:', text.slice(0, 300));
    const data = JSON.parse(text);

    
    if (data.elements && data.elements.length > 0) {
      console.log(`Found ${data.elements.length} elements!`);
      data.elements.forEach((item, idx) => {
        const name = item.tags.name || item.tags['name:en'] || 'Unknown';
        const itemLat = item.lat || (item.center && item.center.lat);
        const itemLng = item.lon || (item.center && item.center.lon);
        console.log(`[${idx}] Type: ${item.tags.place}, Name: ${name}, Lat/Lon: ${itemLat}, ${itemLng}`);
      });
    } else {
      console.log('No elements found.');
    }
  } catch (err) {
    console.error('Overpass test error:', err.message);
  }
}

testOverpass();
