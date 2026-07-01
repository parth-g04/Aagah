const OPENWEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

function mapWmoToOpenWeather(code) {
  if (code === 0) return { description: 'Clear sky', icon: '01d' };
  if (code === 1 || code === 2 || code === 3) return { description: 'Partly cloudy', icon: '02d' };
  if (code === 45 || code === 48) return { description: 'Foggy', icon: '50d' };
  if (code >= 51 && code <= 55) return { description: 'Drizzle', icon: '09d' };
  if (code >= 61 && code <= 65) return { description: 'Rain', icon: '10d' };
  if (code >= 71 && code <= 77) return { description: 'Snow', icon: '13d' };
  if (code >= 80 && code <= 82) return { description: 'Rain showers', icon: '09d' };
  if (code >= 95 && code <= 99) return { description: 'Thunderstorm', icon: '11d' };
  return { description: 'Overcast', icon: '03d' };
}

async function fetchLiveWeather(lat, lng) {
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (apiKey && apiKey !== 'your_weather_api_key_here') {
    try {
      const url = `${OPENWEATHER_API_URL}?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return {
          temp: Math.round(data.main.temp),
          humidity: data.main.humidity,
          wind_speed: data.wind.speed,
          description: data.weather[0].description,
          icon: data.weather[0].icon
        };
      } else {
        console.warn(`OpenWeather returned status ${response.status}. Falling back to Open-Meteo...`);
      }
    } catch (err) {
      console.warn(`OpenWeather request failed: ${err.message}. Falling back to Open-Meteo...`);
    }
  }

  // Fallback to Open-Meteo (Keyless free live weather service)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }
    const data = await response.json();
    const current = data.current;
    const { description, icon } = mapWmoToOpenWeather(current.weather_code);
    
    // Open-Meteo wind speed is in km/h by default, convert to m/s for consistency with OpenWeather
    const windSpeedMs = Math.round((current.wind_speed_10m / 3.6) * 10) / 10;

    return {
      temp: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      wind_speed: windSpeedMs,
      description,
      icon
    };
  } catch (err) {
    console.error(`Both OpenWeather and Open-Meteo failed: ${err.message}`);
    throw err;
  }
}

module.exports = {
  fetchLiveWeather
};
