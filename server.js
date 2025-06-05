const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

// Optional: Simple request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Main weather API endpoint
app.all("/api/weather", (req, res) => {
  // Extract inputs (support GET query or POST JSON)
  const input = req.method === "GET" ? req.query : req.body;

  // Parse floats, provide defaults if needed
  const temperature = parseFloat(input.temperature);
  const humidity = parseFloat(input.humidity);
  const windSpeed = parseFloat(input.windSpeed);
  const windDirection = input.windDirection || "Unknown";

  // Validate required inputs
  const errors = [];
  if (isNaN(temperature)) errors.push("Invalid or missing temperature");
  if (isNaN(humidity)) errors.push("Invalid or missing humidity");
  if (isNaN(windSpeed)) errors.push("Invalid or missing windSpeed");
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation error", details: errors });
  }

  // Calculations
  const discomfortIndex = thomsDiscomfortIndex(temperature, humidity);
  const heatIndex = calculateHeatIndex(temperature, humidity);
  const windChill = temperature < 20 ? calculateWindChill(temperature, windSpeed) : null;
  const dewPoint = calculateDewPoint(temperature, humidity);
  const rainPrediction = getRainPrediction(temperature, humidity, windSpeed);
  const windWarning = getWindWarning(windSpeed);
  const comfortLevel = getComfortLevel(discomfortIndex);
  const clothingSuggestion = getClothingSuggestion(comfortLevel);
  const feelsLike = calculateFeelsLike(temperature, humidity, windSpeed);
  const uvRisk = getUvRisk(temperature, humidity); // Dummy for example

  // Construct JSON response
  const response = {
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
      location: "Plaksha University, Mohali , Punjab - Auth code : 0xPLAKSHA-SAATYAK5462025 ", // optionally add
    },
  };

  res.json(response);
});

// ==== Weather Calculations ====

// Thon's Discomfort Index (comfort measure)
function thomsDiscomfortIndex(temp, humidity) {
  return +(temp - (0.55 - 0.0055 * humidity) * (temp - 14.5)).toFixed(2);
}

// Heat Index (approximate "feels hot" temp)
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

// Wind Chill (feels cold)
function calculateWindChill(temp, windSpeed) {
  if (windSpeed < 4.8) return temp;
  const WCI =
    13.12 +
    0.6215 * temp -
    11.37 * Math.pow(windSpeed, 0.16) +
    0.3965 * temp * Math.pow(windSpeed, 0.16);
  return +WCI.toFixed(2);
}

// Dew Point (humidity comfort indicator)
function calculateDewPoint(temp, humidity) {
  // Magnus formula
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return +dewPoint.toFixed(2);
}

// Rain Prediction (simple heuristic)
function getRainPrediction(temp, humidity, windSpeed) {
  if (humidity > 85 && temp < 30 && windSpeed < 6) return "High";
  if (humidity > 75 && temp < 32) return "Medium";
  return "Low";
}

// Wind Warning
function getWindWarning(windSpeed) {
  if (windSpeed > 25) return "Strong Winds";
  if (windSpeed > 15) return "Breezy";
  return "None";
}

// Comfort Level based on discomfort index
function getComfortLevel(discomfortIndex) {
  if (discomfortIndex < 21) return "Comfortable";
  if (discomfortIndex < 24) return "Slightly Warm";
  if (discomfortIndex < 27) return "Uncomfortable";
  if (discomfortIndex < 29) return "Very Uncomfortable";
  return "Extremely Uncomfortable";
}

// Clothing suggestion based on comfort level
function getClothingSuggestion(comfortLevel) {
  switch (comfortLevel) {
    case "Comfortable":
      return "Wear anything light.";
    case "Slightly Warm":
      return "Light clothes are best.";
    case "Uncomfortable":
      return "Wear cotton, avoid sun.";
    case "Very Uncomfortable":
      return "Stay hydrated, loose cotton clothing.";
    case "Extremely Uncomfortable":
      return "Avoid outdoor activity, stay in shade.";
    default:
      return "Dress as needed.";
  }
}

// Feels Like temperature (simplified composite)
function calculateFeelsLike(temp, humidity, windSpeed) {
  if (temp >= 27) {
    return calculateHeatIndex(temp, humidity);
  } else if (temp < 20) {
    return calculateWindChill(temp, windSpeed);
  } else {
    return temp;
  }
}

// Dummy UV Risk (you can enhance this with real UV index data)
function getUvRisk(temp, humidity) {
  if (temp > 30 && humidity < 50) return "High";
  if (temp > 25) return "Moderate";
  return "Low";
}

// Start server
app.listen(port, () => {
  console.log(`🚀 Weather API running at http://127.0.0.1:${port}/api/weather`);
});
