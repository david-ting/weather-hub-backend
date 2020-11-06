require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const fetch = require("node-fetch");

const API_KEY = process.env.API_KEY;

const corsOptions = {
  origin: process.env.CLIENT_DOMAIN,
  optionsSuccessStatus: 200,
};

const app = express();
app.use(cors(corsOptions));

const PORT = process.env.PORT || 8000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/forecasts/:options/:part", async (req, res) => {
  const { options, part } = req.params;
  const url = `https://api.openweathermap.org/data/2.5/onecall?${options}&exclude=${part}&units=metric&appid=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (response.status === 200) {
      const result = await response.json();
      res.json(result);
    } else {
      throw new Error();
    }
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

app.get("/validate_countryCode/:code", async (req, res) => {
  const code = req.params.code
    .replace(/'/g, "''")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");

  try {
    const result = await pool.query(
      `SELECT COUNT(1) FROM countries WHERE id ILIKE '${code}'`
    );
    switch (result.rows[0].count) {
      case "0":
        res.json(false);
        break;
      case "1":
        res.json(true);
        break;
      default:
        break;
    }
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

app.get("/validate_city/:countryCode/:name", async (req, res) => {
  try {
    const countryCode = req.params.countryCode
      .replace(/'/g, "''")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");

    const name = req.params.name
      .replace(/'/g, "''")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");

    const result = await pool.query(
      `SELECT COUNT(1) FROM cities WHERE name ILIKE '${name}' AND country ILIKE '${countryCode}'`
    );
    switch (result.rows[0].count) {
      case "0":
        res.json(false);
        break;
      case "1":
        res.json(true);
        break;
      default:
        break;
    }
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

// type is name or id
app.get("/get_countries/:type/:query", async (req, res) => {
  const exact = req.query.exact;
  const type = req.params.type;
  const query = req.params.query
    .replace(/'/g, "''")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  try {
    console.log(
      `SELECT * FROM countries WHERE ${type} ILIKE '${query}${
        exact === "true" ? "" : "%"
      }'`
    );
    const result = await pool.query(
      `SELECT * FROM countries WHERE ${type} ILIKE '${query}${
        exact === "true" ? "" : "%"
      }'`
    );
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

app.get("/get_allCities/:countryCode", async (req, res) => {
  const offset = parseInt(req.query.offset);
  const limit = parseInt(req.query.limit);
  const code = req.params.countryCode
    .replace(/'/g, "''")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  try {
    const results = await pool.query(
      `SELECT *, count(*) OVER() AS total
      FROM cities
      WHERE country ILIKE '${code}' 
      LIMIT ${limit} 
      OFFSET ${offset}`
    );
    res.json({
      limit: limit,
      offset: offset,
      total: results.rows.length === 0 ? 0 : parseInt(results.rows[0].total),
      results: results.rows.map((result) => {
        delete result.total;
        return result;
      }),
    });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

app.get("/get_cities/:countryCode/:name", async (req, res) => {
  const offset = parseInt(req.query.offset);
  const limit = parseInt(req.query.limit);
  const code = req.params.countryCode
    .replace(/'/g, "''")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  const name = req.params.name
    .replace(/'/g, "''")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");

  console.log(name);

  try {
    const results = await pool.query(
      `SELECT *, count(*) OVER() AS total
      FROM cities
      WHERE country ILIKE '${code}' AND name ILIKE '${name}%'
      LIMIT ${limit} 
      OFFSET ${offset}`
    );
    res.json({
      limit: limit,
      offset: offset,
      total: results.rows.length === 0 ? 0 : parseInt(results.rows[0].total),
      results: results.rows.map((result) => {
        delete result.total;
        return result;
      }),
    });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

app.listen(PORT, () => {
  console.log(`app listening on PORT: ${PORT}`);
});
