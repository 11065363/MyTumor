const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const request = require('request');
const fs = require('fs');

const {
  init: initDB,
  Counter,
  User,
  Promain,
  region_main,
  region_info,
  gene,
  treatment_require,
  Disease
} = require("./db");
const {
  download
} = require("express/lib/response");

const logger = morgan("tiny");

const app = express();

const cosConfig = {
  Bucket: '7072-prod-6go1azha6b1ef67a-1306110434', // 填写云托管对象存储桶名称
  Region: 'ap-shanghai' // 存储桶地域，默认是上海，其他地域环境对应填写
}
//引擎
var handlebars = require('express3-handlebars')
  .create({
    defaultLayout: 'main'
  });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars'); //引擎

app.use(express.urlencoded({
  extended: false
}));
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

//项目表单
app.get("/projectform", async (req, res) => {
  const personInfoList = await Promain.findAll({
    limit: 10
  });
  console.log(personInfoList);

  res.render('projectform', {
    personInfoList: personInfoList
  })
});

//项目表单
app.get("/patient", async (req, res) => {
  //const personInfoList = await Promain.findAll({ limit: 10 });
  //console.log(personInfoList);

  res.render('patient')
});

//字典管理
app.get("/dictionary", async (req, res) => {
  res.render('dictionary', {
    //personInfoList: personInfoList
  })
});

// 提交数据
app.post("/api/formdata", async (req, res) => {
  console.log("ssee");
  var data = JSON.stringify(req.body)
  console.log(data)
  await Promain.create(req.body);
  res.redirect(303, '/projectform');
});


// 更新计数
app.post("/api/count", async (req, res) => {
  const {
    action
  } = req.body;
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
  const {
    data
  } = req.body;
  console.log("data");
  await User.create({
    username: "sd"
  });
  res.send("data");
});

app.get("/api/test2", async (req, res) => {
  const {
    data
  } = req.body;
  console.log("data");
  await User.create({
    username: "sd"
  });
  res.send("data");
});

app.post("/api/test", async (req, res) => {
  const data = req.body;
  await User.create({
    username: "sd"
  });
  res.send(data.username);
});

app.post("/api/test2", async (req, res) => {
  const data = req.body;
  await User.update({
    username: "sd2"
  }, {
    where: {
      id: 1
    }
  });
  res.send(data.username);
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

//API部分
// 获取地区字典表主表
app.get("/api/region_main", async (req, res) => {
  const result = await region_main.findAll();;
  res.send({
    code: 0,
    data: result,
  });
});

// 地区字典表主表增加
app.post("/api/region_main_insert", async (req, res) => {
  console.log(req.body);
  await region_main.create(req.body);
  res.send({
    code: 0,
    //data: await Counter.count(),
  });
});

// 获取地区字典表info表
app.get("/api/region_info", async (req, res) => {
  //console.log(req.query.regionid);
  let regionid = req.query.regionid;
  const result = await region_info.findAll({
    where: {
      regionid: regionid
    }
  });
  res.send({
    code: 0,
    data: result,
  });
});

// 地区字典表info表增加
app.post("/api/region_info_insert", async (req, res) => {
  console.log(req.body);
  await region_info.create(req.body);
  res.send({
    code: 0,
    //data: await Counter.count(),
  });
});

// 获取基因型字典表
app.get("/api/gene", async (req, res) => {
  const result = await gene.findAll();;
  res.send({
    code: 0,
    data: result,
  });
});

// 基因型表增加
app.post("/api/gene_insert", async (req, res) => {
  console.log(req.body);
  await gene.create(req.body);
  res.send({
    code: 0,
    data: "成功",
  });
});

// 获取治疗线数字典表
app.get("/api/treate", async (req, res) => {
  const result = await treatment_require.findAll();;
  res.send({
    code: 0,
    data: result,
  });
});

// 治疗线数表增加
app.post("/api/treate_insert", async (req, res) => {
  console.log(req.body);
  await treatment_require.create(req.body);
  res.send({
    code: 0,
    data: "成功",
  });
});

// 获取疾病字典表
app.get("/api/disease", async (req, res) => {
  const result = await Disease.findAll();;
  res.send({
    code: 0,
    data: result,
  });
});

// 疾病字典表增加
app.post("/api/disease_insert", async (req, res) => {
  console.log(req.body);
  await Disease.create(req.body);
  res.send({
    code: 0,
    data: "成功",
  });
});

//测试下载接口
app.get("/api/download", async (req, res) => {
  await down(req,res);

});

//测试上传接口
app.get("/api/up", async (req, res) => {
  await up(req,res);

});

function down(req,res) {
  var fileid = 'cloud://prod-6go1azha6b1ef67a.7072-prod-6go1azha6b1ef67a-1306110434/UML.jpg';
  var tmp = fileid.replace(/cloud:\/\/.{6,}.[0-9]*-.{6,}-[0-9]*\//, '/') // 将fileid处理一下，COS-SDK只需要目录
  getFile(tmp, '123.jpg');
  res.send({
    code: 0,
    data: "成功",
  });
}

//测试上传
function up(req,res) {
  // var fileid = 'cloud://prod-6go1azha6b1ef67a.7072-prod-6go1azha6b1ef67a-1306110434/UML.jpg';
  // var tmp = fileid.replace(/cloud:\/\/.{6,}.[0-9]*-.{6,}-[0-9]*\//, '/') // 将fileid处理一下，COS-SDK只需要目录
  // getFile(tmp, '123.jpg');
  uploadFile('a.jpg','C:\Users\admin\Desktop\mygit\MyTumor\a.jpg');
  res.send({
    code: 0,
    data: "成功",
  });
}


const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    initcos();
    console.log("启动成功", port);
  });
}

bootstrap();

/**
 * 封装的 COS-SDK 初始化函数，建议在服务启动时挂载全局，通过 this.cos 使用对象
 */
async function initcos() {
  const COS = require('cos-nodejs-sdk-v5')
  try {
    this.cos = new COS({
      getAuthorization: async function (options, callback) {
        const res = await call({
          url: 'http://api.weixin.qq.com/_/cos/getauth',
          method: 'GET',
        })
        console.log(res)
        const info = JSON.parse(res)
        const auth = {
          TmpSecretId: info.TmpSecretId,
          TmpSecretKey: info.TmpSecretKey,
          SecurityToken: info.Token,
          ExpiredTime: info.ExpiredTime,
        }
        callback(auth)
      },
    })
    //console.log(this.cos);
    console.log('COS初始化成功')
  } catch (e) {
    console.log('COS初始化失败', res)
  }
}

/**
 * 封装的上传文件函数
 * @param {*} cloudpath 上传的云上路径
 * @param {*} filepath 本地文件路径
 */
 async function uploadFile (cloudpath, filepath) {
  const authres = await call({
    url: 'http://api.weixin.qq.com/_/cos/metaid/encode',
    method: 'POST',
    data: {
      openid: '', // 填写用户openid，管理端为空字符串
      bucket: cosConfig.Bucket,
      paths: [cloudpath]
    }
  })
  console.log(authres);
  console.log(this.cos);
  try {
    const auth = JSON.parse(authres)
    const res = await this.cos.putObject({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudpath,
      StorageClass: 'STANDARD',
      Body: fs.createReadStream(filepath),
      ContentLength: fs.statSync(filepath).size,
      Headers: {
        'x-cos-meta-fileid': auth.respdata.x_cos_meta_field_strs[0]
      }
    })
    if (res.statusCode === 200) {
      return {
        code: 0,
        file: JSON.stringify(res)
      }
    } else {
      return {
        code: 1,
        msg: JSON.stringify(res)
      }
    }
  } catch (e) {
    console.log('上传文件失败', e.toString())
    return {
      code: -1,
      msg: e.toString()
    }
  }
}

/**
 * 封装的网络请求方法
 */
function call(obj) {
  return new Promise((resolve, reject) => {
    request({
      url: obj.url,
      method: obj.method || 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(obj.data || {})
    }, function (err, response) {
      if (err) reject(err)
      resolve(response.body)
    })
  })
}

/**
 * 封装的文件下载函数
 * @param {*} cloudpath 文件路径
 * @param {*} filepath 保存本地路径
 */
async function getFile(cloudpath, filepath) {
  console.log("kk1");
  try {
    const res = await this.cos.getObject({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudpath,
      Output: path.join('./', filepath)
    })
    console.log(res);
    console.log("kk");
    if (res.statusCode === 200) {
      return {
        code: 0,
        file: path.join('./', filepath)
      }
    } else {
      return {
        code: 1,
        msg: JSON.stringify(res)
      }
    }
  } catch (e) {
    console.log('下载文件失败', e.toString())
    return {
      code: -1,
      msg: e.toString()
    }
  }
}