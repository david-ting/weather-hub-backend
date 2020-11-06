require("dotenv").config();
const countryList = require("./raw_data/countries.json");
const cityList = require("./raw_data/openweather.city.list.json");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const insertCountries = async () => {
  const countryCodes = Object.keys(countryList);
  const batchArr = countryCodes.map(
    (code) => `('${code}', '${countryList[code]}')`
  );
  const batchString = batchArr.join(",");
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS COUNTRIES(
      ID CHAR(2) PRIMARY KEY NOT NULL,
      NAME TEXT NOT NULL
    );`);
    await pool.query(`INSERT INTO COUNTRIES
    (ID, NAME) VALUES
    ${batchString};`);
  } catch (error) {
    console.log(error);
  }
};

const insertCitis = async () => {
  let cities = cityList.filter((city) => {
    return city.country !== "";
  });

  let batchArr = cities.map(
    (city) =>
      `(${city.id}, '${city.name.replace(/'/g, "''")}', '${city.country.replace(
        /'/g,
        "''"
      )}', ${city.coord.lon}, ${city.coord.lat})`
  );

  const batchString = batchArr.join(",");

  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS CITIES(
      ID INT PRIMARY KEY NOT NULL,
      NAME TEXT NOT NULL,
      COUNTRY CHAR(2) NOT NULL REFERENCES COUNTRIES(ID),
      LON DECIMAL NOT NULL,
      LAT DECIMAL NOT NULL,
      CONSTRAINT NAME_COUNTRY UNIQUE (NAME,COUNTRY)
   );`);
    await pool.query(`INSERT INTO CITIES
        (ID, NAME, COUNTRY, LON, LAT) VALUES
        ${batchString}
        ON CONFLICT (NAME,COUNTRY) DO NOTHING;`);
  } catch (error) {
    console.log(error);
  }
};

const insertAll = async () => {
  await insertCountries();
  await insertCitis();
};

insertAll().finally(() => {
  pool.end();
});
