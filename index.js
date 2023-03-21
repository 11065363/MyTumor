const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const request = require('request');
const fs = require('fs');
const moment = require('moment');
var session = require('express-session');
const {
  Op
} = require("sequelize");

const {
  init: initDB,
  Counter,
  User,
  Promain,
  region_main,
  region_info,
  gene,
  treatment_require,
  Disease,
  Patmaster,
  Promain_patmaster_vs,
  vs_patmaster_project,
  Disease_info,
  Promain_view
} = require("./db");
const {
  download
} = require("express/lib/response");
const {
  nextTick
} = require("process");

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

app.use(express.static(path.join(__dirname, './public')));

// 使用 session 中间件
app.use(session({
  secret: 'secret', // 对session id 相关的cookie 进行签名
  resave: true,
  saveUninitialized: false, // 是否保存未初始化的会话
  cookie: {
    maxAge: 1000 * 6000 * 3, // 设置 session 的有效时间，单位毫秒
  },
}));
app.use('/', function (req, res, next) { ///静态文件
  //console.log("=======================================");
  //console.log("请求路径："+req.url);
  var filename = req.url.split('/')[req.url.split('/').length - 1];
  var suffix = req.url.split('.')[req.url.split('.').length - 1];
  //console.log("文件名：", filename);
  //console.log(suffix);
  //if(suffix in ['gif', 'jpeg', 'jpg', 'png']){
  if (suffix == 'jpg') {
    //console.log("iiii");
    res.writeHead(200, {
      'Content-Type': 'image/' + suffix
    });
    res.end(get_file_content(path.join(__dirname, 'public', 'imgs', filename)));
  }
  next();
});

function get_file_content(filepath) {
  return fs.readFileSync(filepath);
}

// //如果是wxapi不校验是否登录，如果是网页需要校验是否登录。
// app.use(function (req, res, next) {
//   let tmp = req.url.slice(0, 6);
//   if (tmp == "/wxapi") {
//     next();
//   } else {
//     console.log(req.session.userName)
//     if (req.session.userName) { //判断session 状态，如果有效，则返回主页，否则转到登录页面
//        res.sendFile(path.join(__dirname, "index.html"));
//     } else {
//       res.sendFile(path.join(__dirname, "/page/login.html"));
//       //res.redirect('login');
//     }
//   }
//   //res.redirect('login');
//   //next();
// });

// 首页
app.get("/", async (req, res) => {
  if (req.session.userName) { //判断session 状态，如果有效，则返回主页，否则转到登录页面
    //res.sendFile(path.join(__dirname, "index.html"));
    res.sendFile(path.join(__dirname, "/page/login.html"));
  } else {
    res.redirect('login');
  }
});

app.get("/login", async (req, res) => {
  res.sendFile(path.join(__dirname, "/page/login.html"));
});

app.post("/login", async (req, res) => {
  if (req.body.username == 'admin' && req.body.pwd == 'admin123') {
    req.session.userName = req.body.username; // 登录成功，设置 session
    console.log(session.userName)
    res.redirect('/projectform');
  } else {
    res.json({
      ret_code: 1,
      ret_msg: '账号或密码错误'
    }); // 若登录失败，重定向到登录页面
  }
});

//项目表单
app.get("/projectform", async (req, res) => {
  if (req.session.userName) { //判断session 状态，如果有效，则返回主页，否则转到登录页面
    let mylimit = 15;
    let myoffset = 0;
    var t = 1; //当前页
    if (req.query.limit != undefined) {
      mylimit = parseInt(req.query.limit); //获取每页数量
    }
    if (req.query.offset != undefined) {
      myoffset = parseInt(req.query.offset); //获取每页数量
      t = parseInt(myoffset / mylimit) + 1;
    }
    //const personInfoList = await Promain.findAll({
    const {
      count,
      rows
    } = await Promain.findAndCountAll({
      limit: mylimit,
      offset: myoffset,
      order: [
        ['mainid', 'DESC']
      ],
    });
    res.render('projectform', {
      personInfoList: rows,
      currentpage: t,
      totalCount: count
    })
  } else {
    res.redirect('login');
  }

});


//患者-项目表单
app.get("/patient", async (req, res) => {
  if (req.session.userName) { //判断session 状态，如果有效，则返回主页，否则转到登录页面
    res.render('patient')
  } else {
    res.redirect('login');
  }
});

//患者表单
app.get("/patinfo", async (req, res) => {
  if (req.session.userName) { //判断session 状态，如果有效，则返回主页，否则转到登录页面
    res.render('patinfo')
  } else {
    res.redirect('login');
  }
});

//字典管理
app.get("/dictionary", async (req, res) => {
  if (req.session.userName) { //判断session 状态，如果有效，则返回主页，否则转到登录页面
    res.render('dictionary', {
      //personInfoList: personInfoList
    })
  } else {
    res.redirect('login');
  }
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

// 小程序调用，获取微信 Open ID////////////////////////目前没成功
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

//API部分*************************************************************

//获取openid
app.get("/api/wxouth", async (req, res) => {
  //console.log("ssee");
  var data = JSON.stringify(req.body)
  console.log(data)
  var appid = "wx69571ae610f52ccd";
  var secret = "cb8eb8069f90cdbdf458c6c2b12820dd";
  var js_code = "041S5YZv37mnc03YRT3w3np5Cv2S5YZ5"; //来自小程序
  //var grant_type=" authorization_code";
  const result = await call({
    url: 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appid + '&secret=' + secret + '&js_code=' + js_code + '&grant_type=authorization_code',
    method: 'GET',
  })
  console.log(result);
  //https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code 

});

app.post("/api/sendmessage", async (req, res) => {//**********************还需要修改 */
  let myopenid= req.body.myopenid;//"ordPd4j3MByVeVLrwpmY80pMQTm8";//req.query.openid;
  let mypro_name=req.body.mypro_name;
  let myname=req.body.myname;
  let mystatus=req.body.mystatus;
  var canshu = new Object();
  canshu.name1 = "a";
  canshu.phrase3 = "b";
  canshu.thing4 = "c";
  canshu.thing6 = "d";
  var appid = "wx69571ae610f52ccd";
  var secret = "cb8eb8069f90cdbdf458c6c2b12820dd";
  const tokenresult = await call({
    url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret,
    method: 'GET',
  })
  var ttt = eval("(" + tokenresult + ")");

  const result = await call({
    url: 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=' + ttt.access_token,
    method: 'POST',
    data: {
      "touser": myopenid,//"ordPd4tUBZLGxowWznQwYaA9GPc0",//openid
      "template_id": "_nBaREKTiD_4K9lGE9m0YQmu6pQmb52FrP6Tkvd-xY4",
      "data": {
        "name1": {//申请人
          value: myname
        },
        "phrase3": {//审核状态
          value: mystatus
        },
        "thing4": {//审核内容
          value: mypro_name
        },
        "thing6": {
          value: "无"
        }
      },
    }
  })
  console.log(result);
  //https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code 

});

//2023-03新的下载文件接口，老的暂时不用
app.post("/api/newdownloadfile", async (req, res) => {
  var jsonstr=req.body.jsonstr;
  var jsonObj = eval('(' + jsonstr + ')');
  var file_list=new Array();
  
  for(var i=0;i<jsonObj.length;i++){
    var obj=new Object();
    obj.fileid=jsonObj[i];
    obj.max_age=7200
    file_list.push(obj);
  }
  console.log(file_list);


  let myopenid= "ordPd4j3MByVeVLrwpmY80pMQTm8";//req.query.openid;
  var appid = "wx69571ae610f52ccd";
  var secret = "cb8eb8069f90cdbdf458c6c2b12820dd";
  const tokenresult = await call({
    url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret,
    method: 'GET',
  })
  var ttt = eval("(" + tokenresult + ")");
  console.log(ttt);

  const result = await call({
    url: 'https://api.weixin.qq.com/tcb/batchdownloadfile?access_token=' + ttt.access_token,
    method: 'POST',
    data: {
      //"access_token": ttt.access_token,//"ordPd4tUBZLGxowWznQwYaA9GPc0",//openid
      "env": "prod-6go1azha6b1ef67a",///云环境id
      "file_list": file_list,
      // [
      //   {
      //     "fileid":"cloud://prod-6go1azha6b1ef67a.7072-prod-6go1azha6b1ef67a-1306110434/file/example.png",
      //     "max_age":7200
      //   }
      // ],
    }
  })
  // console.log("成功吧")
   console.log(result);
  res.send({
    code: 0,
    data: result,
  })
  //https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code 

});

//项目表单,暂时不用了
app.get("/api/prolistform", async (req, res) => {
  let mylimit = 10;
  let myoffset = 0;
  var t = 1; //当前页
  if (req.query.limit != undefined) {
    mylimit = parseInt(req.query.limit); //获取每页数量
  }
  if (req.query.offset != undefined) {
    myoffset = parseInt(req.query.offset); //获取每页数量
    t = parseInt(myoffset / mylimit) + 1;
  }
  const result = await Promain.findAll({
    limit: mylimit,
    offset: myoffset,
    order: [
      ['mainid', 'DESC']
    ],
  });
  res.send({
    code: 0,
    data: result,
  })

});


//项目表单,传给小程序
app.post("/api/prolistform", async (req, res) => {
  let mylimit = 10;
  let myoffset = 0;
  var where = new Object();
  var newwhere="";
  var t = 1; //当前页
  console.log(req.body);
  if (req.body.limit != undefined) {
    mylimit = parseInt(req.body.limit); //获取每页数量
  }
  if (req.body.offset != undefined) {
    myoffset = parseInt(req.body.offset); //获取每页数量
    t = parseInt(myoffset / mylimit) + 1;
  }
  if (req.body.gene_id != undefined) {
    where.gene_id = req.body.gene_id
  }
  if (req.body.treate_id != undefined) {
    where.treate_id = req.body.treate_id
  }
  if (req.body.disease_id != undefined) {
    where.disease_id = req.body.disease_id
  }
  if (req.body.disease_info_id != undefined) {
    where.disease_info_id = req.body.disease_info_id
  }
  if (req.body.region_id != undefined) {
    where.region_id = req.body.region_id
  }
  if (req.body.region_info_id != undefined) {
    where.region_info_id = req.body.region_info_id
  }

  //where.mainid=7;
  const {
    count,
    rows
  } = await Promain_view.findAndCountAll({
  //const result = await Promain.findAll({
    limit: mylimit,
    offset: myoffset,
    where,
    order: [
      ['mainid', 'DESC']
    ],
    
  });
  res.send({
    code: 0,
    data: rows,
    count:count
  })

});

//项目表单2,传给小程序,最上面的搜索
app.post("/api/prolistformsearch", async (req, res) => {
  let mylimit = 10;
  let myoffset = 0;
  var where = new Object();
  var likename="";
  var t = 1; //当前页
  console.log(req.body);
  if (req.body.limit != undefined) {
    mylimit = parseInt(req.body.limit); //获取每页数量
  }
  if (req.body.offset != undefined) {
    myoffset = parseInt(req.body.offset); //获取每页数量
    t = parseInt(myoffset / mylimit) + 1;
  }
  if (req.body.infolike != undefined) {
    //where.gene_id = req.body.gene_id
    likename=req.body.infolike;
  }
  
  //where.mainid=7;
  const {
    count,
    rows
  } = await Promain.findAndCountAll({
  //const result = await Promain.findAll({
    limit: mylimit,
    offset: myoffset,
    //where,
    where:{
      [Op.or]: [
        {
          pro_name: {
            [Op.like]: '%'+likename+'%'
          }
        },
        {
          medicine: {
            [Op.like]: '%'+likename+'%'
          }
        },
        {
          mainid: {
            [Op.like]: '%'+likename+'%'
          }
        },
        {
          indication: {
            [Op.like]: '%'+likename+'%'
          }
        }
      ]
    },
    
    order: [
      ['mainid', 'DESC']
    ],
    
  });
  res.send({
    code: 0,
    data: rows,
    count:count
  })

});
//修改患者-项目VS表
app.post("/api/updatepromain_patmaster_vs", async (req, res) => {
  //console.log("ssee");
  var where = new Object();
  var data = JSON.stringify(req.body)
  console.log(data)
  await Promain_patmaster_vs.update({
    status: req.body.status
  }, {
    where: {
      vsid: req.body.vsid
    }
  });
  res.send({
    code: 0,
    data: "",
  });
});

//查看患者-项目VS表
app.post("/api/promain_patmaster_vs_find", async (req, res) => {
  //console.log("ssee");
  const result = await Promain_patmaster_vs.findAll({
    where: {
      mainid: req.body.mainid,
      id: req.body.id
    }
  });
  console.log(result.length); 
  if (result.length > 0) {
    res.send({
      code: 0,
      data: "已经申请过，有id和mainid",
    });
  } else {
    res.send({
      code: 1,
      data: "未申请过",
    });
  }
});

//插入患者-项目VS表
app.post("/api/vs_patmaster_project_insert", async (req, res) => {
  await Promain_patmaster_vs.create(req.body);
  res.send({
    code: 0,
    data: "",
  });
});

//插入患者信息
app.post("/api/insertpatient", async (req, res) => {
  //console.log("ssee");
  var resultdata = req.body;
  var appid = "wx69571ae610f52ccd";
  var secret = "cb8eb8069f90cdbdf458c6c2b12820dd";
  var js_code = req.body.openid; //来自小程序
  //var grant_type=" authorization_code";
  const result = await call({
    url: 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appid + '&secret=' + secret + '&js_code=' + js_code + '&grant_type=authorization_code',
    method: 'GET',
  })
  console.log(result);
  var ttt = eval("(" + result + ")");
  resultdata.openid = ttt.openid;
  console.log("*******************");
  var tmp = await Patmaster.create(resultdata);
  console.log(tmp)
  res.send({
    code: 0,
    data: "",
  });
});

//通过jscode获取openid的状态返回
app.post("/api/getopenid", async (req, res) => {
  //console.log("ssee");
  var resultdata = req.body;
  var appid = "wx69571ae610f52ccd";
  var secret = "cb8eb8069f90cdbdf458c6c2b12820dd";
  var js_code = req.body.openid; //来自小程序
  //var js_code = '0811ElFa1ZeNTE0RPpJa11ZQim41ElFE'; //来自小程序
  const result = await call({
    url: 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appid + '&secret=' + secret + '&js_code=' + js_code + '&grant_type=authorization_code',
    method: 'GET',
  })
  //console.log(result);
  var ttt = eval("(" + result + ")");
  var tmpopenid = ttt.openid;
  if (tmpopenid != undefined) {
    console.log("*******************");
    var result2 = await Patmaster.findAll({
      where: {
        openid: tmpopenid
      }
    });
    //console.log(result2);
    //console.log("kkk");
    if (result2.length > 0) {
      res.send({
        code: 0,
        data: 1, //老用户
        content: result2
      });
    } else {
      res.send({
        code: 0,
        data: 0, //新用户
      });
    }

  } else {
    res.send({
      code: 0,
      data: 99, //发生错误
    });
  }
});

// 获取患者信息表
app.get("/api/exam_n", async (req, res) => {
  const result = await Patmaster.findAll();;
  res.send({
    code: 0,
    data: result,
  });
});

// 获取患者-项目信息表
app.get("/api/vs_patmaster_project", async (req, res) => {
  var canshu1 = ''
  var cansh2 = ''
  let status = req.query.data;
  if (status == 0) //未审核
  {
    canshu1 = Op.is;
    cansh2 = null
  }
  if (status == 1) //已审核
  {
    canshu1 = Op.not;
    cansh2 = null
  }
  tmp = null;
  tmp2 = Op.is
  const result = await vs_patmaster_project.findAll({
    where: {
      status: {
        [canshu1]: cansh2
      }
    }
  });
  res.send({
    code: 0,
    data: result,
  });
});

// 根据id获取患者-项目信息表
app.post("/api/vs_patmaster_project_id", async (req, res) => {
  var id = req.body.id
  const result = await vs_patmaster_project.findAll({
    where: {
      id: id
    }
  });
  res.send({
    code: 0,
    data: result,
  });
});


//通过id获得患者的基本信息
app.post("/api/getpatient_id", async (req, res) => {
  var id = req.body.id
  const result = await Patmaster.findAll({
    where: {
      id: id
    }
  });
  res.send({
    code: 0,
    data: result,
  });
});


app.post("/api/formdata", async (req, res) => {
  //console.log("ssee");
  var data = JSON.stringify(req.body)
  console.log(data)
  await Promain.create(req.body);
  res.redirect(303, '/projectform');
});

// 修改数据
app.post("/api/formdataupdate", async (req, res) => {
  console.log("ssee");
  var data = JSON.stringify(req.body)
  //console.log(data)
  // console.log(req.body)
  // console.log(req.body.mainid)
  await Promain.update(req.body, {
    where: {
      mainid: req.body.mainid
    }
  });
  res.redirect(303, '/projectform');
});

//获取某一个项目，通过mainid
app.get("/api/projectlist", async (req, res) => {
  let mainid = req.query.mainid;
  const result = await Promain.findAll({
    where: {
      mainid: mainid
    }
  });
  res.send({
    code: 0,
    data: result,
  });
});

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

// 获取疾病2字典表主表
app.get("/api/disease_main", async (req, res) => {
  const result = await Disease.findAll();;
  res.send({
    code: 0,
    data: result,
  });
});

// 疾病2字典表主表增加
app.post("/api/disease_main_insert", async (req, res) => {
  console.log(req.body);
  await Disease.create(req.body);
  res.send({
    code: 0,
    //data: await Counter.count(),
  });
});

// 疾病2字典表info表
app.get("/api/disease_info", async (req, res) => {
  let diseaseid = req.query.diseaseid;
  const result = await Disease_info.findAll({
    where: {
      diseaseid: diseaseid
    }
  });
  res.send({
    code: 0,
    data: result,
  });
});

// 疾病2字典表info表增加
app.post("/api/disease_info_insert", async (req, res) => {
  console.log(req.body);
  await Disease_info.create(req.body);
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
  const result = await Disease.findAll();
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
  let fileid = req.query.fileid;
  var mypath = await getpathname(); //创建存图像的文件夹。
  //var fileid = 'cloud://prod-6go1azha6b1ef67a.7072-prod-6go1azha6b1ef67a-1306110434/resource/123.jpg'; //'/UML.jpg';
  var tmppath = fileid.replace(/cloud:\/\/.{6,}.[0-9]*-.{6,}-[0-9]*\//, '/') // 将fileid处理一下，COS-SDK只需要目录
  const lastname = fileid.split(/[\\/]/).pop();
  // console.log("lastname:"+lastname);
  // console.log("mypath:"+mypath);
  await getFile(tmppath, mypath + '\\' + lastname);
  res.download(mypath + '\\' + lastname);
  // res.send({
  //   code: 0,
  //   data: "成功",
  // });

});

//得到下载图像存放文件夹的地址
function getpathname() {
  var today = moment();
  var mypath = "resource\\img\\" + today.format('YYYYMMDD');
  var oldpath = "resource\\img\\" + today.subtract(1, 'days').format('YYYYMMDD');
  // console.log(oldpath);
  // console.log(mypath);
  deleteDir(oldpath); //删除昨天的图像文件
  if (fs.existsSync(mypath)) { //创建今天的图像文件
    console.log("删除掉昨天的文件夹");
  } else {
    fs.mkdirSync(mypath);
  }
  return mypath;
}

function deleteDir(url) {
  var files = [];

  if (fs.existsSync(url)) { //判断给定的路径是否存在
    files = fs.readdirSync(url); //返回文件和子目录的数组
    files.forEach(function (file, index) {
      var curPath = path.join(url, file);
      if (fs.statSync(curPath).isDirectory()) { //同步读取文件夹文件，如果是文件夹，则函数回调
        deleteDir(curPath);
      } else {
        fs.unlinkSync(curPath); //是指定文件，则删除
      }
    });
    fs.rmdirSync(url); //清除文件夹
  } else {
    console.log("给定的路径不存在！");
  }
}

//测试下载图片接口
app.get("/api/downpic", async (req, res) => {
  //let sort = req.query.sort
  // let img = req.query.img
  // let path = `${img}`
  // const data = fs.readFile(path, function (err, data) {
  //   if (err) {
  //     res.send('读取错误')
  //   } else {
  //     console.log(data);
  //     res.send(data)//直接返回byte[]

  //   }

  //     res.sendFile('C:/Users/lenovo/Pictures/love.jpg');//第二种下载
  // });
  res.download('a.jpg');
})

//测试上传接口
app.get("/api/up", async (req, res) => {
  await up(req, res);

});


//测试上传
function up(req, res) {
  uploadFile('a.jpg', 'a.jpg');
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
async function uploadFile(cloudpath, filepath) {
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
  try {
    const res = await this.cos.getObject({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudpath,
      Output: path.join('./', filepath)
    })
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