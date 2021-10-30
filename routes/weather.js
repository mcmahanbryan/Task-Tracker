const { response } = require("express");
const express = require("express");
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));



/* Weather POST
------------------------------------------------*/
router.post("/", async function (req, res) {
    const weatherLocation = req.body.weatherLocation;
    const state = weatherLocation.slice(weatherLocation.length - 2).toUpperCase();
    const apiKey = process.env.OPEN_WEATHER_API;
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${weatherLocation}&appid=${apiKey}&units=imperial`;
    let weatherHtml;

    let response = await fetch(url);

    if (response.ok) {
        let json = await response.json();
    
        weatherHtml = `
        <tr class="weather-table-row">
            <td>${json.name}, ${state}</td>
        </tr>
        <tr class="weather-table-row">
            <td>${json.weather[0].main}</td>
        </tr>
        <tr class="weather-table-row">
            <td>Feels like: ${json.main.feels_like}</td>
        </tr>
        <tr class="weather-table-row">
            <td>Actual temperature:  ${json.main.temp}</td>
        </tr>
        `;
    } else {
        weatherHtml = ` <tr class="weather-table-row"><p>Error: ${response.status} : ${response.statusText}</p></tr>`;
    }

    const responseData = {
        weatherHtml: weatherHtml,
      };

    res.send(responseData);
});

module.exports = router;
