const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.all("/api/weather", (req, res) => {
  const input = req.method === "GET" ? req.query : req.body;
  const temperature = parseFloat(input.temperature);
  const humidity = parseFloat(input.humidity);
  const windSpeed = parseFloat(input.windSpeed);
  const windDirection = input.windDirection || "Unknown";

  const errors = [];
  
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation error", details: errors });
  }

  const discomfortIndex = thomsDiscomfortIndex(temperature, humidity);
  const heatIndex = calculateHeatIndex(temperature, humidity);
  const windChill = temperature < 20 ? calculateWindChill(temperature, windSpeed) : null;
  const dewPoint = calculateDewPoint(temperature, humidity);
  const rainPrediction = getRainPrediction(temperature, humidity, windSpeed);
  const windWarning = getWindWarning(windSpeed);
  const comfortLevel = getComfortLevel(discomfortIndex);
  const clothingSuggestion = getClothingSuggestion(comfortLevel);
  const feelsLike = calculateFeelsLike(temperature, humidity, windSpeed);
  const uvRisk = getUvRisk(temperature, humidity);

  res.json({
    input: { temperature, humidity, windSpeed, windDirection },
    indices: {
      discomfortIndex,
      heatIndex,
      windChill,
      dewPoint,
      feelsLike,
      uvRisk,
    },
    weatherForecast: {
      rainPrediction,
      windWarning,
      comfortLevel,
      clothingSuggestion,
    },
    meta: {
      serverTime: new Date().toISOString(),
      location: "Plaksha University, Mohali , Punjab - Auth code : why are you here sir? "
    }
  });
});

// ====== Weather Calculations Below ======

function thomsDiscomfortIndex(temp, humidity) {
  return +(temp - (0.55 - 0.0055 * humidity) * (temp - 14.5)).toFixed(2);
}

function calculateHeatIndex(T, RH) {
  if (T < 27 || RH < 40) return T;
  const HI =
    -8.784695 +
    1.61139411 * T +
    2.338549 * RH -
    0.14611605 * T * RH -
    0.01230809 * T * T -
    0.01642482 * RH * RH +
    0.00221173 * T * T * RH +
    0.00072546 * T * RH * RH -
    0.00000358 * T * T * RH * RH;
  return +HI.toFixed(2);
}

function calculateWindChill(temp, windSpeed) {
  if (windSpeed < 4.8) return temp;
  return +(13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16)).toFixed(2);
}

function calculateDewPoint(temp, humidity) {
  const a = 17.27, b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  return +((b * alpha) / (a - alpha)).toFixed(2);
}

function getRainPrediction(temp, humidity, windSpeed) {
  if (humidity > 85 && temp < 30 && windSpeed < 6) return "High";
  if (humidity > 75 && temp < 32) return "Medium";
  return "Low";
}

function getWindWarning(windSpeed) {
  if (windSpeed <= 0) return "No wind give";
  if (windSpeed > 25) return "Strong Winds";
  if (windSpeed > 15) return "Breezy";
  return "None";
}

function getComfortLevel(discomfortIndex) {
  if (discomfortIndex < 21) return "Comfortable";
  if (discomfortIndex < 24) return "Slightly Warm";
  if (discomfortIndex < 27) return "Uncomfortable";
  if (discomfortIndex < 29) return "Very Uncomfortable";
  return "Extremely Uncomfortable";
}

function getClothingSuggestion(comfortLevel) {
  switch (comfortLevel) {
    case "Comfortable": return "Wear anything light.";
    case "Slightly Warm": return "Light clothes are best.";
    case "Uncomfortable": return "Wear cotton, avoid sun.";
    case "Very Uncomfortable": return "Stay hydrated, loose cotton clothing.";
    case "Extremely Uncomfortable": return "Avoid outdoor activity, stay in shade.";
    default: return "Dress as needed.";
  }
}

function calculateFeelsLike(temp, humidity, windSpeed) {
  if (temp >= 27) return calculateHeatIndex(temp, humidity);
  if (temp < 20) return calculateWindChill(temp, windSpeed);
  return temp;
}

function getUvRisk(temp, humidity) {
  if (temp > 30 && humidity < 50) return "High";
  if (temp > 25) return "Moderate";
  return "Low";
}

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}/api/weather`);
});
