const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const passport = require("passport");
require("./config/passport")(passport);
//因為 client 和 server port 不一樣，會有跨來源訪問的問題
//所以後端需要設置 cors 來允許接受前端 react request
const cors = require("cors");

//連結到 mongoDB
mongoose
  .connect("mongodb://localhost:27017/mernDB")
  .then(() => {
    console.log("連結到 mongodb...");
  })
  .catch((e) => {
    console.log(e);
  });

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
//有關 api/user 的需求都由 authRoute 處理
app.use("/api/user", authRoute);

//只有登入系統的人，才能夠去新增課程或註冊課程
//course route 應該被 jwt 保護
//如果 request header 內部沒有 jwt，則 request 就會被視為 unauthorized
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  courseRoute
);

//port 3000 是 React 預設
//這裡用 8080
app.listen(8080, () => {
  console.log("後端伺服器聆聽 port 8080");
});
