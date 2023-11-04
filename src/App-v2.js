import React from "react";

// EXPLANATION
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
  // Here we don't need the 'this' keyword because the 'this' keyword is automatically bound to the class instance.
  // In other words the 'this' keyword will simply be placed on the component instance.
  state = {
    location: "",
    isLoading: false,
    displayLocation: "",
    weather: {},
  };

  /*
  constructor(props) {
    super(props);
    // this.state = {
    //   location: "",
    //   isLoading: false,
    //   displayLocation: "",
    //   weather: {},
    // };

    // We don't need to bind the 'this' keyword to the class instance because we are using arrow functions.
    // this.handleSetLocation = this.handleSetLocation.bind(this);
    // this.fetchWeather = this.fetchWeather.bind(this);
  }
  */

  // handleSetLocation(event) {
  handleSetLocation = (event) => {
    this.setState({ location: event.target.value });
  };

  // async fetchWeather() {
  fetchWeather = async () => {
    // Guard clause (if location is empty)
    if (!this.state.location) {
      this.setState({ weather: {} }); // Here we clear/reset the weather
      return;
    }

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
      console.error(err.message);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  // EXPLANATION
  /*
  This is a lifecycle method.
  It is called after the component is 'rendered/mounts' for the first time.
  As soon as the component is mounted, we want to fetch the weather.
  This is the same as useEffect(() => {}, []) in functional components.

  When the component is mounted for the first time, there might not be any location in local storage.
  So we need to set the default location.
  */
  componentDidMount() {
    // this.fetchWeather(); // We don't need this because we are using componentDidUpdate()

    // Get the location from local storage
    const location = localStorage.getItem("location"); // Here we get the location from local storage
    if (location) {
      // We use destructuring because the key and value are the same (location: location)
      // When we set the state, we essentially re-render the component (componentDidUpdate() is called)
      this.setState({ location }); // Here we set the location from local storage if it exists
    } else {
      this.setState({ location: "" }); // Here we set the default location
    }
  }

  // EXPLANATION
  /*
  This is a lifecycle method.
  It is called after the component is updated (after the state or props change) and re-rendered.
  As soon as the component is updated, we want to fetch the weather.
  This is the same as useEffect(() => {}, [state, props]) in functional components.
  REMEMBER: If we were using useEffect(() => {}, [state, props]) it would be called after the first render (on mount) and every time the state or props change (after every re-render).
  */
  componentDidUpdate(prevProps, prevState) {
    if (prevState.location !== this.state.location) {
      this.fetchWeather();

      // Store the location in local storage
      localStorage.setItem("location", this.state.location);
    }
  }

  render() {
    return (
      <div className="app">
        <h1>Classy Weather</h1>

        {/* Here we use child-parent communication */}
        <Input
          location={this.state.location}
          onChangeLocation={this.handleSetLocation}
        />

        {/* <button onClick={this.fetchWeather}>Get Weather</button> */}

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

// Here we establish child-parent communication.
class Input extends React.Component {
  render() {
    return (
      <div>
        <input
          type="text"
          placeholder="Search from locatioin..."
          // value={this.state.location}
          value={this.props.location}
          // onChange={(event) => this.setState({ location: event.target.value })}
          onChange={this.props.onChangeLocation}
        />
      </div>
    );
  }
}

class Weather extends React.Component {
  componentWillUnmount() {
    console.log("Weather component unmounted");
  }

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
