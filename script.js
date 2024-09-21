let weather = {
  apiKey: "734674e116f7d5d72c8812c5d353e21d",
  unsplashApiKey: "YOUR_UNSPLASH_API_KEY", // Replace with your Unsplash API key
  units: "metric",
  fetchWeather: function (city) {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${this.units}&appid=${this.apiKey}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("No weather found.");
        }
        return response.json();
      })
      .then((data) => this.displayWeather(data))
      .catch((error) => this.showError(error.message));
  },
  fetchForecast: function (city) {
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${this.units}&appid=${this.apiKey}`
    )
      .then((response) => response.json())
      .then((data) => this.displayForecast(data))
      .catch((error) => console.error("Error fetching forecast:", error));
  },
  displayWeather: function (data) {
    const { name } = data;
    const { icon, description, main } = data.weather[0];
    const { temp, humidity } = data.main;
    const { speed } = data.wind;
    document.querySelector("#city-name").innerText = name;
    document.querySelector(".icon").src =
      "https://openweathermap.org/img/wn/" + icon + "@2x.png";
    document.querySelector(".description").innerText = description;
    document.querySelector(".temp").innerText = this.formatTemperature(temp);
    document.querySelector(".humidity").innerText =
      "Humidity: " + humidity + "%";
    document.querySelector(".wind").innerText =
      "Wind speed: " + speed + (this.units === "metric" ? " m/s" : " mph");
    document.querySelector(".weather").classList.remove("loading");
    
    // Update background image based on weather condition
    this.setBackgroundImage(data.weather[0].main, data.weather[0].description, data.name);
  },
  setBackgroundImage: function (weatherMain, weatherDescription, cityName) {
    const query = this.getBackgroundQuery(weatherMain, weatherDescription, cityName);
    fetch(`https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${this.unsplashApiKey}`)
      .then(response => response.json())
      .then(data => {
        if (data.urls && data.urls.regular) {
          document.body.style.backgroundImage = `url('${data.urls.regular}')`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
          document.body.style.backgroundRepeat = 'no-repeat';
        }
      })
      .catch(error => {
        console.error("Error fetching background image:", error);
        // Fallback to a default background if there's an error
        document.body.style.backgroundImage = "url('https://source.unsplash.com/1600x900/?nature')";
      });
  },
  getBackgroundQuery: function (weatherMain, weatherDescription, cityName) {
    const timeOfDay = this.getTimeOfDay();
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return `${timeOfDay} clear sky`;
      case 'clouds':
        return `${weatherDescription} sky`;
      case 'rain':
      case 'drizzle':
        return 'rainy weather';
      case 'thunderstorm':
        return 'thunderstorm';
      case 'snow':
        return 'snowy weather';
      case 'mist':
      case 'fog':
        return 'foggy weather';
      default:
        return `${cityName} ${timeOfDay}`;
    }
  },
  getTimeOfDay: function () {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  },
  displayForecast: function (data) {
    const forecastContainer = document.querySelector(".forecast-container");
    forecastContainer.innerHTML = "";
    for (let i = 0; i < data.list.length; i += 8) {
      const forecastData = data.list[i];
      const date = new Date(forecastData.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const icon = forecastData.weather[0].icon;
      const temp = this.formatTemperature(forecastData.main.temp);
      
      const forecastDay = document.createElement("div");
      forecastDay.classList.add("forecast-day");
      forecastDay.innerHTML = `
        <div>${dayName}</div>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="weather icon">
        <div>${temp}</div>
      `;
      forecastContainer.appendChild(forecastDay);
    }
  },
  search: function () {
    const city = document.querySelector(".search-bar").value;
    this.fetchWeather(city);
    this.fetchForecast(city);
  },
  formatTemperature: function (temp) {
    return Math.round(temp) + (this.units === "metric" ? "°C" : "°F");
  },
  showError: function (message) {
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = message;
    errorElement.style.display = "block";
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 3000);
  },
  getGeolocation: function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.fetchWeatherByCoords(lat, lon);
        },
        (error) => {
          this.showError("Unable to retrieve your location");
        }
      );
    } else {
      this.showError("Geolocation is not supported by your browser");
    }
  },
  fetchWeatherByCoords: function (lat, lon) {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${this.units}&appid=${this.apiKey}`
    )
      .then((response) => response.json())
      .then((data) => {
        this.displayWeather(data);
        this.fetchForecast(data.name);
      })
      .catch((error) => this.showError("Error fetching weather data"));
  },
  toggleUnits: function () {
    this.units = this.units === "metric" ? "imperial" : "metric";
    const unitToggleBtn = document.getElementById("unit-toggle");
    unitToggleBtn.textContent = `Switch to ${this.units === "metric" ? "°F" : "°C"}`;
    document.querySelector(".unit").textContent = this.units === "metric" ? "°C" : "°F";
    this.search();
  },
  fetchCitySuggestions: function (query) {
    if (query.length < 3) return; // Only fetch suggestions for queries with 3 or more characters
    fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${this.apiKey}`
    )
      .then((response) => response.json())
      .then((data) => this.displayCitySuggestions(data))
      .catch((error) => console.error("Error fetching city suggestions:", error));
  },
  displayCitySuggestions: function (suggestions) {
    const datalist = document.getElementById('city-suggestions');
    datalist.innerHTML = '';
    suggestions.forEach(city => {
      const option = document.createElement('option');
      option.value = `${city.name}, ${city.country}`;
      datalist.appendChild(option);
    });
  }
};

document.querySelector("#search-btn").addEventListener("click", function () {
  weather.search();
});

document.querySelector(".search-bar").addEventListener("keyup", function (event) {
  if (event.key == "Enter") {
    weather.search();
  }
});

document.getElementById("geolocation-btn").addEventListener("click", function () {
  weather.getGeolocation();
});

document.getElementById("unit-toggle").addEventListener("click", function () {
  weather.toggleUnits();
});

weather.fetchWeather("Bhopal");
weather.fetchForecast("Bhopal");

document.querySelector(".search-bar").addEventListener("input", function (event) {
  weather.fetchCitySuggestions(event.target.value);
});
