require("dotenv").config();
const express = require('express')
const compression = require('compression')
const hpp = require('hpp')
const categoriesRouter = require("./routes/categories")
const subCategoryRouter = require("./routes/subCategory")
const subSubCategoryRouter = require("./routes/subSubCategory")
const brandsRouter = require("./routes/brands")
const productsRouter = require("./routes/products")
const usersRouter = require("./routes/users")
const cartsRouter = require("./routes/cart")
const couponsRouter = require("./routes/coupons")
const ordersRouter = require("./routes/orders")
const reviewsRouter = require("./routes/review")
const settingRouter = require("./routes/setting")
const cors = require('cors')
const http = require("http");
const path = require("path");
const fs = require("fs");
// const os = require("os");
// const cluster = require("cluster");
// const host = "127.0.0.1"
const host = "0.0.0.0";
const port = 8080
// const numCPUs = os.cpus().length;


// if (cluster.isPrimary) {
//   console.log(`🧠 Primary process ${process.pid} is running`);

//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`❌ Worker ${worker.process.pid} died. Restarting...`);
//     cluster.fork();
//   });

// } else {

//   const app = express()
//   app.use(cors())
//   app.use(compression())
//   app.use(express.json());
//   app.use(hpp());


//   app.get('/api/v1/uploads/:foldername/:filename', (req, res) => {
//     const { foldername, filename } = req.params;
//     const decodedFilename = decodeURIComponent(filename);
//     const filePath = path.join(__dirname, 'uploads', foldername, decodedFilename);

//     // تحقق من أن الملف موجود وليس مجلدًا
//     if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
//       return res.status(404).send('❌ File not found');
//     }

//     res.sendFile(filePath, (err) => {
//       if (err) {
//         console.error("❌ Error sending file:", err);
//         if (!res.headersSent) {
//           res.status(500).send('❌ Error sending file');
//         }
//       }
//     });
//   });

//   app.use("/api/v1/categories", categoriesRouter);
//   app.use("/api/v1/sub_category", subCategoryRouter);
//   app.use("/api/v1/sub_sub_category", subSubCategoryRouter);
//   app.use("/api/v1/brands", brandsRouter);
//   app.use("/api/v1/products", productsRouter);


//   app.use((req, res) => {
//     res.status(404).json({
//       status: false,
//       message: "url not found"
//     });
//   });


//   const server = http.createServer(app);

//   // listen to port 8080
//   server.listen(port, host, () => {
//     console.log("server is running");
//   });
// }


const app = express()
app.use(cors())
app.use(compression())
app.use(express.json());
app.use(hpp());


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

app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/sub_category", subCategoryRouter);
app.use("/api/v1/sub_sub_category", subSubCategoryRouter);
app.use("/api/v1/brands", brandsRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/cart", cartsRouter);
app.use("/api/v1/coupons", couponsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/reviews", reviewsRouter);
app.use("/api/v1/setting", settingRouter);


app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "url not found"
  });
});


const server = http.createServer(app);

// listen to port 8080
server.listen(port, host, () => {
  console.log("server is running");
});