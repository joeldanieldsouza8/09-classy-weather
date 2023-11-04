// import React from "react";
import { useState, useEffect, useCallback } from "react";

// Helper function to debounce another function
const debounce = (func, wait) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function App() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [error, setError] = useState("");

  // Refactored fetchWeather with useCallback and abort functionality
  const fetchWeather = useCallback(async () => {
    if (!location) {
      setWeather(null);
      return;
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    setIsLoading(true);
    setError("");

    try {
      // 1) Getting location (geocoding)
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
        { signal }
      );
      const geoData = await geoResponse.json();

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results[0];
      setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

      // 2) Getting actual weather
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
        { signal }
      );
      const weatherData = await weatherResponse.json();

      setWeather(weatherData.daily);
    } catch (error) {
      if (error.name !== "AbortError") {
        setError("Failed to fetch weather");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }

    return () => {
      abortController.abort();
    };
  }, [location]);

  useEffect(() => {
    // Call the fetchWeather function which returns the cleanup function
    const abortFetch = fetchWeather();

    // Cleanup function for useEffect
    return () => {
      if (abortFetch) abortFetch();
    };
  }, [fetchWeather]);

  // Debounced setLocation to limit the number of API calls during typing
  const debouncedSetLocation = debounce(setLocation, 500);

  return (
    <div className="app">
      <h1>Classy Weather</h1>
      <Input
        location={location}
        onChangeLocation={(e) => debouncedSetLocation(e.target.value)}
      />
      {isLoading && <p className="loader">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {weather && <Weather weather={weather} location={displayLocation} />}
    </div>
  );
}

function Input({ location, onChangeLocation }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Search from locatioin..."
        value={location}
        onChange={onChangeLocation}
      />
    </div>
  );
}

function Weather({ weather, location }) {
  useEffect(() => {
    return () => {
      console.log("Weather component unmounted");
    };
  }, []);

  const {
    temperature_2m_max: maxTemp,
    temperature_2m_min: minTemp,
    weathercode: code,
    time: dates,
  } = weather;

  return (
    <div>
      <h2>Weather in {location}</h2>
      <ul className="weather">
        {dates.map((date, index) => (
          <Day
            key={date}
            date={date}
            maxTemp={maxTemp.at(index)}
            minTemp={minTemp.at(index)}
            code={code.at(index)}
            isToday={index === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, maxTemp, minTemp, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p> {isToday ? "Today" : formatDay(date)}</p>
      <p>
        <strong>
          {Math.floor(minTemp)}°C - {Math.floor(maxTemp)}°C
        </strong>
      </p>
    </li>
  );
}
