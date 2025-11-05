// Load env variables from .env file.
require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();

// Define variables from environment file.
const PORT = process.env.PORT || 3000;
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const OBJECT_TYPE_ID = process.env.CUSTOM_OBJECT_TYPE_ID;

// Express setup.
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Create an axios instance for the HubSpot API.
const hs = axios.create({
  baseURL: "https://api.hubapi.com",
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Home Page Route.
app.get("/", async (req, res) => {
  try {
    // Define the properties for fetch.
    const properties = ["book_title", "book_description", "book_author"];
    const limit = 20;

    const { data } = await hs.post(`/crm/v3/objects/${OBJECT_TYPE_ID}/search`, {
      properties,
      limit,
      sorts: [{ propertyName: "hs_createdate", direction: "DESCENDING" }],
    });

    // Convert API response to simpler object.
    const rows = (data.results || []).map((r) => ({
      id: r.id,
      ...r.properties,
    }));

    // Render Homepage.pug page.
    res.render("homepage", { title: "Books", rows, properties });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).send("Failed to load records");
  }
});

// Display Add Book Form Route.
app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
  });
});

// Update Form Route.
app.post("/update-cobj", async (req, res) => {
  try {
    // Fetch Book Properties from Request Body.
    const { book_title, book_author, book_description } = req.body;

    // POST Request to HubSpot API to Create a New Record
    await hs.post(`crm/v3/objects/${OBJECT_TYPE_ID}`, {
      properties: {
        book_title,
        book_description,
        book_author,
      },
    });
    // Redirect to Home Page.
    res.redirect("/");
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).send("Failed to Create Record");
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
