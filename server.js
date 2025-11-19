require("dotenv").config();
const express = require('express')
const compression = require('compression')
const hpp = require('hpp')
const cookieParser = require("cookie-parser");

const cors = require('cors')
const path = require("path");
const fs = require("fs");
const host = "0.0.0.0";
const port = 8080;

const app = express()
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

app.use(compression())
app.use(express.json());
app.use(hpp());

// Uploads
app.get('/api/v1/uploads/:foldername/:filename', (req, res) => {
  const { foldername, filename } = req.params;
  const decodedFilename = decodeURIComponent(filename);
  const filePath = path.join(__dirname, 'uploads', foldername, decodedFilename);

  // تحقق من أن الملف موجود وليس مجلدًا
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return res.status(404).send('❌ File not found');
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("❌ Error sending file:", err);
      if (!res.headersSent) {
        res.status(500).send('❌ Error sending file');
      }
    }
  });
});

// Routes
const categoriesRouter = require("./routes/categories.route");
app.use("/api/v1/categories", categoriesRouter);

const subCategoryRouter = require("./routes/subCategory.route");
app.use("/api/v1/sub_category", subCategoryRouter);

const subSubCategoryRouter = require("./routes/subSubCategory.route");
app.use("/api/v1/sub_sub_category", subSubCategoryRouter);

const brandsRouter = require("./routes/brands.route");
app.use("/api/v1/brands", brandsRouter);

const productsRouter = require("./routes/products.route");
app.use("/api/v1/products", productsRouter);

const usersRouter = require("./routes/users.route");
app.use("/api/v1/users", usersRouter);

const couponsRouter = require("./routes/coupons.route");
app.use("/api/v1/coupons", couponsRouter);

const reviewsRouter = require("./routes/review.route");
app.use("/api/v1/reviews", reviewsRouter);

const settingRouter = require("./routes/setting.route");
app.use("/api/v1/setting", settingRouter);

const adsRouter = require("./routes/ads.route");
app.use("/api/v1/ads", adsRouter);

const currenciesRouter = require("./routes/currencies.route");
app.use("/api/v1/currencies", currenciesRouter);


app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "url not found"
  });
});

const axios = require("axios");
const cron = require("node-cron");
const { currency } = require("./models");

// we update currency rates every 6 hours
cron.schedule("0 */6 * * *", async () => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateString}/v1/currencies/usd.json`;
    let response;
    try {
      response = await axios.get(url);
    } catch (e) {
      response = await axios.get("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json");
    }
    const rates = response.data.usd;
    const existingCurrencies = await currency.findAll({ attributes: ['code'] });
    const existingCodes = existingCurrencies.map(c => c.code.toUpperCase());

    for (const [code, rate] of Object.entries(rates)) {
      if (existingCodes.includes(code.toUpperCase())) {
        await currency.update(
          { exchange_rate: rate },
          { where: { code: code.toUpperCase() } }
        );
      }
    }

    console.log("✅ Currency rates updated successfully");
  } catch (err) {
    console.error("❌ Failed to update currency rates:", err.message);
  }
});

// listen to port 8080
app.listen(port, host, () => {
  console.log("server is running");
});