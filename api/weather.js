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
  if (isNaN(temperature)) errors.push("Invalid or missing temperature");
  if (isNaN(humidity)) errors.push("Invalid or missing humidity");
  if (isNaN(windSpeed)) errors.push("Invalid or missing windSpeed");

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation error", details: errors });
  }

  // Fixed calculation thresholds and logic
  const discomfortIndex = thomsDiscomfortIndex(temperature, humidity);
  const heatIndex = calculateHeatIndex(temperature, humidity);
  const windChill = temperature <= 10 ? calculateWindChill(temperature, windSpeed) : null;
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
      rainPrediction: rainPrediction,
      windWarning,
      comfortLevel,
      clothingSuggestion,
    },
    meta: {
      serverTime: new Date().toISOString(),
      location: "Plaksha University, Mohali, Punjab - Auth code: 0xPLAKSHA-SAATYAK5462025"
    }
  });
});

// ====== Fixed Weather Calculations ======

function thomsDiscomfortIndex(temp, humidity) {
  return +(temp - (0.55 - 0.0055 * humidity) * (temp - 14.5)).toFixed(2);
}

function calculateHeatIndex(T, RH) {
  if (T < 26.7 || RH < 40) return T;
  const c1 = -8.784695, c2 = 1.61139411, c3 = 2.338549, c4 = -0.14611605;
  const c5 = -0.01230809, c6 = -0.01642482, c7 = 0.00221173, c8 = 0.00072546, c9 = -0.00000358;
  
  return +(
    c1 +
    c2 * T +
    c3 * RH +
    c4 * T * RH +
    c5 * T * T +
    c6 * RH * RH +
    c7 * T * T * RH +
    c8 * T * RH * RH +
    c9 * T * T * RH * RH
  ).toFixed(2);
}

function calculateWindChill(temp, windSpeed) {
  if (temp > 10 || windSpeed < 4.8) return temp;
  return +(13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16)).toFixed(2);
}

function calculateDewPoint(temp, humidity) {
  if (humidity <= 0) return -Infinity;
  const a = 17.27, b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  return +((b * alpha) / (a - alpha)).toFixed(2);
}

function getRainPrediction(temp, humidity, windSpeed) {
  if (humidity > 85 && temp < 30 && windSpeed < 15) return "High";
  if (humidity > 75 && temp < 32) return "Medium";
  return "Low";
}

function getWindWarning(windSpeed) {
  if (windSpeed > 25) return "High Wind Warning";
  if (windSpeed > 15) return "Wind Advisory";
  return "Normal Conditions";
}

function getComfortLevel(discomfortIndex) {
  if (discomfortIndex < 21) return "Comfortable";
  if (discomfortIndex < 24) return "Slightly Warm";
  if (discomfortIndex < 27) return "Uncomfortable";
  if (discomfortIndex < 29) return "Very Uncomfortable";
  return "Dangerous Conditions";
}

function getClothingSuggestion(comfortLevel) {
  const suggestions = {
    "Comfortable": "Light layers recommended",
    "Slightly Warm": "Breathable fabrics suggested",
    "Uncomfortable": "Light cotton clothing, avoid synthetics",
    "Very Uncomfortable": "Loose cotton clothing, stay hydrated",
    "Dangerous Conditions": "Avoid outdoor exposure, seek AC"
  };
  return suggestions[comfortLevel] || "Dress according to conditions";
}

function calculateFeelsLike(temp, humidity, windSpeed) {
  if (temp >= 27) return calculateHeatIndex(temp, humidity);
  if (temp <= 10) return calculateWindChill(temp, windSpeed);
  return temp;
}

function getUvRisk(temp, humidity) {
  if (temp > 35 && humidity < 30) return "Extreme";
  if (temp > 30 && humidity < 50) return "Very High";
  if (temp > 25) return "Moderate";
  return "Low";
}

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}/api/weather`);
});
