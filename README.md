# Wanderlust

Wanderlust is a travel discovery web app that helps users explore a city with:
- current weather
- top attractions
- a map preview

The app is built with vanilla HTML, CSS, and JavaScript and uses public APIs.

## Features

- City search with geocoding
- Live weather conditions (temperature, humidity, wind, day/night)
- Up to 10 attractions per search
- Attraction fallback strategy for better reliability:
  - Wikipedia nearby search
  - Nominatim/OpenStreetMap backup
  - Curated fallback data for select cities (including Toronto)
- Embedded OpenStreetMap view for destination context
- Custom favicon for browser tab thumbnail
- Responsive layout for desktop and mobile

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

## Data Sources

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
- [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page)
- [Nominatim (OpenStreetMap)](https://nominatim.org/release-docs/latest/api/Search/)
- [OpenStreetMap Embed](https://www.openstreetmap.org/)

## Project Structure

```text
Wanderlust/
├── index.html
├── README.md
├── img/
└── public/
    ├── favicon.ico
    ├── favicon.svg
    ├── helpers.js
    ├── main.js
    ├── reset.css
    └── style.css
```

## Getting Started

1. Clone this repository:
```bash
git clone <your-repo-url>
cd Wanderlust
```
2. Start a local static server (recommended):
```bash
python3 -m http.server 8080
```
3. Open:
`http://localhost:8080`

## Usage

1. Enter a city (example: `Toronto`, `Paris`, `Tokyo`).
2. Click **Explore**.
3. View weather, map, and up to 10 attraction cards.

## Notes

- No API keys are required for the current data providers.
- For deployed updates, hard-refresh once if browser cache keeps old JS/CSS/favicon.

## License

This project is for educational and portfolio use.
