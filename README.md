# :cloud: Weather Hub Backend

The project has been published to heroku. It serves as the backend for [**Weather Hub Frontend**](https://github.com/david-ting/weather-hub-frontend).

It uses Node.js as a Web Server (with [**Express**](https://expressjs.com/) framework) for making requests to the OpenWeather API to 
get weather forecast data. It also connects to the PostgreSQL database (which stores the information of available cities in the OpenWeather API and
relevant country names and codes). The frontend can make requests to the backend for querying the city and country data for enabling the 
autosuggestion feature. 

#### Environmental variable
* DATABASE_URL (for connecting to the PostgreSQL database)
* CLIENT_DOMAIN (for enabling cors requests)
* API_KEY (API_KEY for OpenWeather API)
