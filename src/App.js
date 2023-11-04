// import React from "react";
import { useState, useEffect } from "react";

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

  function handleSetLocation(event) {
    setLocation(event.target.value);
  }

  // This is the same as componentDidMount and componentDidUpdate
  // REMEMBER: useEffect is called after every render (including the first one) and it's called after the DOM has been updated with the changes made by the render.
  // REMEMBER: In React class components. The hook takes two arguments: a function that contains the side-effect logic and a list of dependencies. React will re-run the side effect after rendering when the dependencies have changed.
  useEffect(() => {
    async function fetchWeather() {
      if (!location) {
        setWeather({});
        return;
      }

      const abortController = new AbortController();
      const { signal } = abortController;

      try {
        // 0) Set loading to true
        setIsLoading(true);
        setError("");

        // 1) Getting location (geocoding)
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
          { signal }
        );
        const geoData = await geoRes.json();
        console.log(geoData);

        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country_code } =
          geoData.results.at(0);
        // console.log(`${name} ${convertToFlag(country_code)}`);
        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

        // 2) Getting actual weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
          { signal }
        );

        const weatherData = await weatherRes.json();
        // console.log(weatherData.daily);
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
    }

    fetchWeather();
  }, [location]);

  return (
    <div className="app">
      <h1>Classy Weather</h1>

      {/* Here we use child-parent communication */}
      <Input location={location} onChangeLocation={handleSetLocation} />

      {isLoading ? <p className="loader">Loading...</p> : null}

      {weather.weathercode ? (
        <Weather weather={weather} location={displayLocation} />
      ) : null}
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
