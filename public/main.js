const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city");
const statusNode = document.querySelector("#status");
const resultsNode = document.querySelector("#results");
const destinationNode = document.querySelector("#destination");
const weatherNode = document.querySelector("#weather");
const venuesNode = document.querySelector("#venues");
const mapFrame = document.querySelector("#map-frame");
const MAX_ATTRACTIONS = 9;

const fallbackAttractionImage = "/img/travel-header-vancouver.jpg";
const curatedAttractions = {
  toronto: [
    {
      title: "CN Tower",
      summary:
        "Toronto landmark with observation decks, glass floor views, and skyline panoramas.",
      url: "https://www.cntower.ca/",
      distance: 2000,
    },
    {
      title: "Royal Ontario Museum",
      summary:
        "Major museum with art, culture, and natural history exhibits in downtown Toronto.",
      url: "https://www.rom.on.ca/",
      distance: 2600,
    },
    {
      title: "Distillery Historic District",
      summary:
        "Pedestrian neighborhood known for preserved Victorian buildings, galleries, and dining.",
      url: "https://www.thedistillerydistrict.com/",
      distance: 3000,
    },
    {
      title: "Ripley's Aquarium of Canada",
      summary:
        "Large downtown aquarium with marine exhibits, moving walkway, and interactive galleries.",
      url: "https://www.ripleyaquariums.com/canada/",
      distance: 2100,
    },
    {
      title: "Art Gallery of Ontario",
      summary:
        "Major art museum featuring Canadian, Indigenous, and international collections.",
      url: "https://ago.ca/",
      distance: 2400,
    },
    {
      title: "Casa Loma",
      summary:
        "Historic castle-style mansion with gardens, exhibits, and city views.",
      url: "https://casaloma.ca/",
      distance: 4800,
    },
    {
      title: "St. Lawrence Market",
      summary:
        "Historic market known for local food vendors, produce, and specialty shops.",
      url: "https://www.stlawrencemarket.com/",
      distance: 2700,
    },
    {
      title: "Toronto Islands",
      summary:
        "Scenic island park with beaches, trails, and skyline viewpoints accessible by ferry.",
      url: "https://www.toronto.ca/explore-enjoy/parks-gardens-beaches/toronto-island-park/",
      distance: 5000,
    },
    {
      title: "High Park",
      summary:
        "Large urban park with walking trails, gardens, and seasonal cherry blossoms.",
      url: "https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-gardens/high-park/",
      distance: 7000,
    },
    {
      title: "Hockey Hall of Fame",
      summary:
        "Museum celebrating hockey history with memorabilia and interactive exhibits.",
      url: "https://www.hhof.com/",
      distance: 2300,
    },
    {
      title: "Kensington Market",
      summary:
        "Eclectic neighborhood with vintage shops, cafes, street art, and global food.",
      url: "https://kensingtonmarket.to/",
      distance: 3200,
    },
    {
      title: "Toronto Zoo",
      summary:
        "Large zoo with global wildlife habitats, conservation programs, and family exhibits.",
      url: "https://www.torontozoo.com/",
      distance: 14000,
    },
  ],
};

const weatherCodeMap = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const escapeHTML = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const cToF = (tempC) => ((tempC * 9) / 5 + 32).toFixed(1);

const createMapUrl = (lat, lon) => {
  const lonMin = Math.max(-180, lon - 0.2);
  const lonMax = Math.min(180, lon + 0.2);
  const latMin = Math.max(-85, lat - 0.12);
  const latMax = Math.min(85, lat + 0.12);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lonMin}%2C${latMin}%2C${lonMax}%2C${latMax}&layer=mapnik&marker=${lat}%2C${lon}`;
};

const setStatus = (message, type) => {
  statusNode.className = type ? `status-${type}` : "";
  statusNode.textContent = message;
};

const clearResults = () => {
  destinationNode.innerHTML = "";
  weatherNode.innerHTML = "";
  venuesNode.innerHTML = "";
  mapFrame.removeAttribute("src");
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
    throw new Error("No destination found. Try another city.");
  }

  const match = data.results[0];
  return {
    name: match.name,
    admin: match.admin1 || "",
    country: match.country || "",
    timezone: match.timezone || "auto",
    latitude: match.latitude,
    longitude: match.longitude,
    population: match.population || null,
  };
};

const getWeather = async (place) => {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=${encodeURIComponent(place.timezone)}`;
  const data = await fetchJSON(weatherUrl);
  if (!data.current) {
    throw new Error("Weather data unavailable.");
  }
  return data.current;
};

const getAttractionsFromWikipedia = async (place) => {
  const geoSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${place.latitude}%7C${place.longitude}&gsradius=25000&gslimit=${MAX_ATTRACTIONS * 3}&format=json&formatversion=2&origin=*`;
  const geoData = await fetchJSON(geoSearchUrl);
  let candidates = (geoData.query && geoData.query.geosearch) || [];

  // Fallback to text search when geosearch has no nearby entries.
  if (candidates.length === 0) {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${place.name} attractions landmarks`)}&srlimit=${MAX_ATTRACTIONS * 3}&format=json&formatversion=2&origin=*`;
    const searchData = await fetchJSON(searchUrl);
    candidates = ((searchData.query && searchData.query.search) || []).map(
      (item, index) => ({
        pageid: item.pageid,
        title: item.title,
        dist: (index + 1) * 1000,
      }),
    );
  }

  if (candidates.length === 0) {
    return [];
  }

  const topCandidates = candidates.slice(0, MAX_ATTRACTIONS);
  const details = await Promise.all(
    topCandidates.map(async (item) => {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`;
      try {
        const summaryData = await fetchJSON(summaryUrl);
        const description = summaryData.extract || "No summary available yet.";
        return {
          id: item.pageid,
          title: item.title,
          distance: item.dist || 0,
          summary:
            description.length > 180
              ? `${description.slice(0, 177)}...`
              : description,
          url:
            summaryData.content_urls?.desktop?.page ||
            `https://en.wikipedia.org/?curid=${item.pageid}`,
          image: summaryData.thumbnail?.source || fallbackAttractionImage,
        };
      } catch (error) {
        return {
          id: item.pageid,
          title: item.title,
          distance: item.dist || 0,
          summary: "No summary available yet.",
          url: `https://en.wikipedia.org/?curid=${item.pageid}`,
          image: fallbackAttractionImage,
        };
      }
    }),
  );

  return details;
};

const getAttractionsFromNominatim = async (place) => {
  const query = `top tourist attractions in ${place.name}`;
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${MAX_ATTRACTIONS}&addressdetails=1`;
  const data = await fetchJSON(nominatimUrl);
  return data.slice(0, MAX_ATTRACTIONS).map((item, index) => ({
    id: item.place_id || `${place.name}-${index}`,
    title:
      item.name || item.display_name.split(",")[0] || `Attraction ${index + 1}`,
    distance: (index + 1) * 1000,
    summary: `${item.type ? item.type.replace(/_/g, " ") : "Destination"} in ${place.name}.`,
    url: `https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}#map=15/${item.lat}/${item.lon}`,
    image: fallbackAttractionImage,
  }));
};

const getCuratedAttractions = (place) => {
  const key = place.name.toLowerCase();
  const entries = curatedAttractions[key] || [];
  return entries.slice(0, MAX_ATTRACTIONS).map((item, index) => ({
    id: `${key}-${index}`,
    title: item.title,
    distance: item.distance,
    summary: item.summary,
    url: item.url,
    image: fallbackAttractionImage,
  }));
};

const getAttractions = async (place) => {
  try {
    const wikiResults = await getAttractionsFromWikipedia(place);
    if (wikiResults.length > 0) {
      return wikiResults;
    }
  } catch (error) {
    // Fall through to backup source.
  }

  try {
    const nominatimResults = await getAttractionsFromNominatim(place);
    if (nominatimResults.length > 0) {
      return nominatimResults;
    }
  } catch (error) {
    // Fall through to curated fallback.
  }

  return getCuratedAttractions(place);
};

const renderDestination = (place) => {
  const subLocation = [place.admin, place.country].filter(Boolean).join(", ");
  const population = place.population
    ? Number(place.population).toLocaleString()
    : "Not listed";

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
  const condition = weatherCodeMap[weather.weather_code] || "Unknown";
  const period = weather.is_day ? "Daytime" : "Nighttime";
  const icon = weather.is_day ? "sunny" : "night";

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
    `,
    )
    .join("");
};

const renderMap = (place) => {
  mapFrame.src = createMapUrl(place.latitude, place.longitude);
};

const handleSearch = async (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();
  if (!query) {
    setStatus("Enter a city name to search.", "error");
    return;
  }

  clearResults();
  setStatus(`Searching for "${query}"...`, "loading");
  resultsNode.classList.add("visible");

  try {
    const destination = await getDestination(query);
    const [weather, attractions] = await Promise.all([
      getWeather(destination),
      getAttractions(destination),
    ]);

    renderDestination(destination);
    renderWeather(weather);
    renderAttractions(attractions);
    renderMap(destination);
    setStatus(
      `Showing live travel insights for ${destination.name}.`,
      "success",
    );
  } catch (error) {
    setStatus(
      error.message || "Something went wrong. Please try again.",
      "error",
    );
  }
};

searchForm.addEventListener("submit", handleSearch);
