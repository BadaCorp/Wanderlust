const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city');
const statusNode = document.querySelector('#status');
const resultsNode = document.querySelector('#results');
const destinationNode = document.querySelector('#destination');
const weatherNode = document.querySelector('#weather');
const venuesNode = document.querySelector('#venues');
const mapFrame = document.querySelector('#map-frame');

const fallbackAttractionImage = '/img/travel-header-vancouver.jpg';

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
};

const escapeHTML = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const cToF = (tempC) => ((tempC * 9) / 5 + 32).toFixed(1);

const createMapUrl = (lat, lon) => {
  const lonMin = Math.max(-180, lon - 0.2);
  const lonMax = Math.min(180, lon + 0.2);
  const latMin = Math.max(-85, lat - 0.12);
  const latMax = Math.min(85, lat + 0.12);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lonMin}%2C${latMin}%2C${lonMax}%2C${latMax}&layer=mapnik&marker=${lat}%2C${lon}`;
};

const setStatus = (message, type) => {
  statusNode.className = type ? `status-${type}` : '';
  statusNode.textContent = message;
};

const clearResults = () => {
  destinationNode.innerHTML = '';
  weatherNode.innerHTML = '';
  venuesNode.innerHTML = '';
  mapFrame.removeAttribute('src');
};

const fetchJSON = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
};

const getDestination = async (query) => {
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const data = await fetchJSON(geocodeUrl);
  if (!data.results || data.results.length === 0) {
    throw new Error('No destination found. Try another city.');
  }

  const match = data.results[0];
  return {
    name: match.name,
    admin: match.admin1 || '',
    country: match.country || '',
    timezone: match.timezone || 'auto',
    latitude: match.latitude,
    longitude: match.longitude,
    population: match.population || null
  };
};

const getWeather = async (place) => {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=${encodeURIComponent(place.timezone)}`;
  const data = await fetchJSON(weatherUrl);
  if (!data.current) {
    throw new Error('Weather data unavailable.');
  }
  return data.current;
};

const getAttractions = async (place) => {
  const geoSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${place.latitude}%7C${place.longitude}&gsradius=12000&gslimit=6&format=json&origin=*`;
  const geoData = await fetchJSON(geoSearchUrl);
  const candidates = (geoData.query && geoData.query.geosearch) || [];
  if (candidates.length === 0) {
    return [];
  }

  const pageIds = candidates.slice(0, 6).map((item) => item.pageid).join('|');
  const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages%7Cextracts%7Cinfo&inprop=url&exintro=true&explaintext=true&pithumbsize=900&pageids=${pageIds}&format=json&origin=*`;
  const detailData = await fetchJSON(detailUrl);
  const pages = (detailData.query && detailData.query.pages) || {};

  return candidates.slice(0, 3).map((placeItem) => {
    const detail = pages[String(placeItem.pageid)] || {};
    const summary = detail.extract || 'No summary available yet.';
    return {
      id: placeItem.pageid,
      title: placeItem.title,
      distance: placeItem.dist,
      summary: summary.length > 180 ? `${summary.slice(0, 177)}...` : summary,
      url: detail.fullurl || `https://en.wikipedia.org/?curid=${placeItem.pageid}`,
      image: (detail.thumbnail && detail.thumbnail.source) || fallbackAttractionImage
    };
  });
};

const renderDestination = (place) => {
  const subLocation = [place.admin, place.country].filter(Boolean).join(', ');
  const population = place.population ? Number(place.population).toLocaleString() : 'Not listed';

  destinationNode.innerHTML = `
    <h2>${escapeHTML(place.name)}</h2>
    <p>${escapeHTML(subLocation)}</p>
    <div class="destination-meta">
      <span>Timezone: ${escapeHTML(place.timezone)}</span>
      <span>Population: ${population}</span>
    </div>
  `;
};

const renderWeather = (weather) => {
  const condition = weatherCodeMap[weather.weather_code] || 'Unknown';
  const period = weather.is_day ? 'Daytime' : 'Nighttime';
  const icon = weather.is_day ? 'sun' : 'moon';

  weatherNode.innerHTML = `
    <div class="weather-card">
      <div class="weather-main">
        <p class="weather-condition">${escapeHTML(condition)}</p>
        <h3>${weather.temperature_2m.toFixed(1)}&deg;C / ${cToF(weather.temperature_2m)}&deg;F</h3>
      </div>
      <img src="https://api.iconify.design/mdi/weather-${icon}.svg?color=%23f25f4c" alt="${icon}" class="weather-icon">
    </div>
    <div class="weather-meta">
      <span>Feels like ${weather.apparent_temperature.toFixed(1)}&deg;C</span>
      <span>Humidity ${weather.relative_humidity_2m}%</span>
      <span>Wind ${weather.wind_speed_10m.toFixed(1)} km/h</span>
      <span>${period}</span>
    </div>
  `;
};

const renderAttractions = (attractions) => {
  if (attractions.length === 0) {
    venuesNode.innerHTML = `<p class="empty-copy">No nearby attraction data was found for this destination.</p>`;
    return;
  }

  venuesNode.innerHTML = attractions
    .map(
      (attraction) => `
      <article class="venue-card">
        <img src="${escapeHTML(attraction.image)}" alt="${escapeHTML(attraction.title)}" class="venue-image">
        <div class="venue-content">
          <h3>${escapeHTML(attraction.title)}</h3>
          <p>${escapeHTML(attraction.summary)}</p>
          <a href="${escapeHTML(attraction.url)}" target="_blank" rel="noopener noreferrer">Read more</a>
          <span>${Math.round(attraction.distance)}m from center</span>
        </div>
      </article>
    `
    )
    .join('');
};

const renderMap = (place) => {
  mapFrame.src = createMapUrl(place.latitude, place.longitude);
};

const handleSearch = async (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();
  if (!query) {
    setStatus('Enter a city name to search.', 'error');
    return;
  }

  clearResults();
  setStatus(`Searching for "${query}"...`, 'loading');
  resultsNode.classList.add('visible');

  try {
    const destination = await getDestination(query);
    const [weather, attractions] = await Promise.all([
      getWeather(destination),
      getAttractions(destination)
    ]);

    renderDestination(destination);
    renderWeather(weather);
    renderAttractions(attractions);
    renderMap(destination);
    setStatus(`Showing live travel insights for ${destination.name}.`, 'success');
  } catch (error) {
    setStatus(error.message || 'Something went wrong. Please try again.', 'error');
  }
};

searchForm.addEventListener('submit', handleSearch);
