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
const path = require("path");
const port = process.env.PORT || 8080; // process.env.PORT 是 Heroku 自動動態設定

//連結到 mongoDB
mongoose
  .connect(process.env.MONGODB_CONNECTION)
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
app.use(express.static(path.join(__dirname, "client", "build")));

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

//網站的首頁網址是 URL/....
//這個意思是：Horkou 接收到除了上述有 api 的 routes ，且當 env 是 product 或 staging
//的時候， horkou 就會導向到 client 的路徑，也就是 client : xx/index
if (process.env.NODE_ENV === "producet" || process.env.NODE_ENV === "staging") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
}

//port 3000 是 React 預設
//這裡用 8080
app.listen(port, () => {
  console.log("後端伺服器聆聽 port 8080");
});
