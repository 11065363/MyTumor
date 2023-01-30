const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter, User } = require("./db");

const logger = morgan("tiny");

const app = express();
//引擎
var handlebars=require('express3-handlebars')
	.create({defaultLayout:'main'
    });
app.engine('handlebars',handlebars.engine);
app.set('view engine','handlebars');//引擎

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  //res.send("kk");
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", async (req, res) => {
  //res.send("kk");
  res.sendFile(path.join(__dirname, "/page/login.html"));
});

app.get("/projectform", async (req, res) => {
  //res.send("kk");
  res.render('projectform');
  //res.sendFile(path.join(__dirname, "/page/projectform.html"));
});


// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 测试
app.get("/api/test", async (req, res) => {
  const { data } = req.body;
  console.log("data");
  await User.create({username:"sd"});
  res.send("data");
});

app.get("/api/test2", async (req, res) => {
  const { data } = req.body;
  console.log("data");
  await User.create({username:"sd"});
  res.send("data");
});

app.post("/api/test", async (req, res) => {
  const data  = req.body;
  await User.create({username:"sd"});
  res.send(data.username);
});

app.post("/api/test2", async (req, res) => {
  const data  = req.body;
  await User.update({username:"sd2"},{where:{id:1}});
  res.send(data.username);
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
