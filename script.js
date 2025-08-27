const apiKey = "d2edfeb68c7a5faa775d0a429cc92b29"; // 🔑 Replace with your OpenWeather API key
const resultDiv = document.getElementById("weatherResult");
const maxRecent = 5;

// ---------------- Theme Toggle ----------------
const themeToggleBtn = document.getElementById("themeToggle");

// Load theme from localStorage
let darkMode = localStorage.getItem("darkMode") === "true";

// ---------------- Forecast Card Colors ----------------
function updateForecastCardColors() {
  const forecastCards = document.querySelectorAll("#weatherResult .flex > div"); 
  forecastCards.forEach(card => {
    if (darkMode) {
      card.classList.remove("from-sky-200", "to-blue-100");
      card.classList.add("bg-gray-800", "text-white");
    } else {
      card.classList.add("from-sky-200", "to-blue-100");
      card.classList.remove("bg-gray-800", "text-white");
    }
  });
}

// ---------------- Main Weather Text Colors ----------------
function updateTextColors() {
  const mainTextElems = document.querySelectorAll(".weatherText, #weatherResult h3, #weatherResult span.weatherText");

  mainTextElems.forEach(el => {
    if(darkMode) {
      el.classList.remove("text-black");
      el.classList.add("text-white");
    } else {
      el.classList.remove("text-white");
      el.classList.add("text-black");
    }
  });
}

// ---------------- Recent Button Colors ----------------
function updateRecentButtonColors() {
  const recentButtons = document.querySelectorAll("#recentSearches button");
  recentButtons.forEach(btn => {
    if(darkMode) {
      btn.classList.remove("text-black");
      btn.classList.add("text-white");
    } else {
      btn.classList.add("text-black");
      btn.classList.remove("text-white");
    }
  });
}

// ---------------- Apply Theme ----------------
function applyTheme() {
  if (darkMode) {
    document.body.classList.remove("bg-gradient-to-b", "from-sky-400", "to-blue-100");
    document.body.classList.add("bg-gray-900", "text-white");
    themeToggleBtn.textContent = "☀️ Light Mode";
  } else {
    document.body.classList.add("bg-gradient-to-b", "from-sky-400", "to-blue-100");
    document.body.classList.remove("bg-gray-900", "text-white");
    themeToggleBtn.textContent = "🌙 Dark Mode";
  }

  updateForecastCardColors();
  updateTextColors();
  updateRecentButtonColors();
}

themeToggleBtn.addEventListener("click", () => {
  darkMode = !darkMode;
  localStorage.setItem("darkMode", darkMode);
  applyTheme();
});

// Apply theme on page load
applyTheme();

// ---------------- Recent Searches ----------------
function saveRecentCity(city) {
  let recent = JSON.parse(localStorage.getItem("recentCities")) || [];
  recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  if (recent.length > maxRecent) recent.pop();
  localStorage.setItem("recentCities", JSON.stringify(recent));
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById("recentSearches");
  const recent = JSON.parse(localStorage.getItem("recentCities")) || [];
  container.innerHTML = "";

  recent.forEach(city => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.className = "px-3 py-1 bg-gray-200 rounded-lg shadow hover:bg-gray-300 transition text-sm";
    btn.addEventListener("click", () => getWeather(city));
    container.appendChild(btn);
  });

  updateRecentButtonColors(); // Ensure colors match current theme
}

// Render recent searches on page load
renderRecentSearches();

// ---------------- Auto-load last searched city ----------------
window.addEventListener("load", () => {
  const lastCity = localStorage.getItem("lastCity");
  if (lastCity) {
    getWeather(lastCity);
  }
});

// ---------------- City Search ----------------
document.getElementById("getWeatherBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) {
    resultDiv.classList.remove("hidden");
    resultDiv.innerHTML = `<p class="text-red-500 font-semibold">⚠️ Please enter a city name</p>`;
    return;
  }
  getWeather(city);
});

// ---------------- Current Location ----------------
document.getElementById("getCurrentLocationBtn").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        if (!response.ok) throw new Error("Could not fetch weather for your location");
        const data = await response.json();

        displayWeather(data);
        getForecastByCoords(lat, lon);
        saveRecentCity(data.name);
        localStorage.setItem("lastCity", data.name);

      } catch (error) {
        resultDiv.classList.remove("hidden");
        resultDiv.innerHTML = `<p class="text-red-500 font-semibold">❌ ${error.message}</p>`;
      }
    }, () => {
      alert("Geolocation permission denied!");
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

// ---------------- Fetch Weather by City ----------------
async function getWeather(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    if (!response.ok) throw new Error("City not found");
    const data = await response.json();

    displayWeather(data);
    getForecast(city);
    saveRecentCity(city);
    localStorage.setItem("lastCity", city);

  } catch (error) {
    resultDiv.classList.remove("hidden");
    resultDiv.innerHTML = `<p class="text-red-500 font-semibold">❌ ${error.message}</p>`;
  }
}

// ---------------- Display Main Weather ----------------
function displayWeather(data) {
  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = `
    <h2 class="weatherText text-xl font-bold mb-2">${data.name}, ${data.sys.country}</h2>
    <p class="weatherText text-lg mb-2">🌡 Temp: <span class="weatherText font-semibold">${data.main.temp} °C</span></p>
    <p class="weatherText capitalize mb-2">☁️ Weather: ${data.weather[0].description}</p>
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" 
         alt="Weather Icon" class="mx-auto mb-2">
    <p class="weatherText">💨 Wind Speed: ${data.wind.speed} m/s</p>
  `;
  updateTextColors(); // ensure all text is visible in dark mode
}

// ---------------- 5-Day Forecast by City ----------------
async function getForecast(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );
    if (!response.ok) throw new Error("Forecast not found");
    const data = await response.json();

    displayForecast(data);

  } catch (error) {
    console.error("Forecast error:", error);
  }
}

// ---------------- 5-Day Forecast by Coordinates ----------------
async function getForecastByCoords(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    if (!response.ok) throw new Error("Forecast not found");
    const data = await response.json();

    displayForecast(data);

  } catch (error) {
    console.error("Forecast error:", error);
  }
}

// ---------------- Display 5-Day Forecast ----------------
function displayForecast(data) {
  const dailyForecast = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  let forecastHTML = `
    <h3 class="text-lg font-bold mb-2">5-Day Forecast</h3>
    <div class="flex overflow-x-auto space-x-2 py-2">
  `;

  dailyForecast.forEach(item => {
    const date = new Date(item.dt_txt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    forecastHTML += `
      <div class="bg-gradient-to-br from-sky-200 to-blue-100 p-4 rounded-xl min-w-[90px] text-center shadow flex-shrink-0 hover:scale-105 transform transition">
        <p class="font-semibold text-sm">${date}</p>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Icon" class="mx-auto my-1 w-12 h-12">
        <p class="capitalize text-xs">${item.weather[0].description}</p>
        <p class="text-sm mt-1">🌡 ${item.main.temp.toFixed(1)}°C</p>
      </div>
    `;
  });

  forecastHTML += '</div>';
  resultDiv.innerHTML += forecastHTML;

  updateForecastCardColors();
  updateTextColors(); // ensure all forecast text is visible in dark mode
}
