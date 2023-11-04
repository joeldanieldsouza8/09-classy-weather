import React from "react";

/* 
  When do we need to use constructor(props) and super(props) in React?
    When we want to use this.props inside the constructor, we need to pass props to the constructor and call super(props) inside the constructor.
    When we don't use this.props inside the constructor, we don't need to pass props to the constructor and call super(props) inside the constructor.
*/

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

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: "",
      isLoading: false,
      displayLocation: "",
      weather: {},
    };
    this.handleChange = this.handleChange.bind(this);
    this.fetchWeather = this.fetchWeather.bind(this);
  }

  handleChange(event) {
    this.setState({ location: event.target.value });
  }

  async fetchWeather() {
    try {
      // 0) Set loading to true
      this.setState({ isLoading: true });

      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      // console.log(`${name} ${convertToFlag(country_code)}`);
      this.setState({
        displayLocation: `${name} ${convertToFlag(country_code)}`,
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      // console.log(weatherData.daily);
      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.err(err);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  render() {
    return (
      <div className="app">
        <h1>Classy Weather</h1>

        <div>
          <input
            type="text"
            placeholder="Search from locatioin..."
            value={this.state.location}
            onChange={(event) => this.handleChange(event)}
          />
        </div>

        <button onClick={this.fetchWeather}>Get Weather</button>

        {this.state.isLoading ? <p className="loader">Loading...</p> : null}

        {this.state.weather.weathercode ? (
          <Weather
            weather={this.state.weather}
            location={this.state.displayLocation}
          />
        ) : null}
      </div>
    );
  }
}

export default App;

class Weather extends React.Component {
  render() {
    console.log(this.props); // debug

    const {
      temperature_2m_max: maxTemp,
      temperature_2m_min: minTemp,
      weathercode: code,
      time: dates,
    } = this.props.weather;

    return (
      <div>
        <h2>Weather in {this.props.location}</h2>
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
}

class Day extends React.Component {
  render() {
    const { date, maxTemp, minTemp, code, isToday } = this.props;
    console.log(this.props); // debug

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
}
