require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const OBJECT_TYPE_ID = process.env.CUSTOM_OBJECT_TYPE_ID;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const hs = axios.create({
  baseURL: "https://api.hubapi.com",
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    "Content-Type": "application/json",
  },
});

app.get("/", async (req, res) => {
  try {
    const properties = ["book_title", "book_description", "book_author"];
    const limit = 20;

    const { data } = await hs.post(`/crm/v3/objects/${OBJECT_TYPE_ID}/search`, {
      properties,
      limit,
      sorts: [{ propertyName: "hs_createdate", direction: "DESCENDING" }],
    });

    const rows = (data.results || []).map((r) => ({
      id: r.id,
      ...r.properties,
    }));

    res.render("homepage", { title: "Books", rows, properties });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).send("Failed to load records");
  }
});

app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
  });
});

app.post("/update-cobj", async (req, res) => {
  try {
    const { book_title, book_author, book_description } = req.body;

    await hs.post(`crm/v3/objects/${OBJECT_TYPE_ID}`, {
      properties: {
        book_title,
        book_description,
        book_author,
      },
    });
    res.redirect("/");
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).send("Failed to Create Record");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
