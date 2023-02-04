const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split(":");

const sequelize = new Sequelize("nodejs_demo", MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: "mysql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
});

// 定义数据模型
const Counter = sequelize.define("Counter", {
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});
// 定义数据模型User
const User = sequelize.define("User", {
  id:{
    type:DataTypes.INTEGER,
    primaryKey:true
  },
  username: {
    type: DataTypes.STRING,
  },
  password: {
    type: DataTypes.STRING,
  },
  userphone: {
    type: DataTypes.STRING,
  },
  userAcount: {
    type: DataTypes.STRING,
  },
},{
  //timestamps: false, // 不要默认时间戳 数据库没有时间戳字段时，设置为false，否则报错  SequelizeDatabaseError: Unknown column 'createdAt' in 'field list'
  freezeTableName: true 
});

// 定义数据模型Promain
const Promain = sequelize.define("Promain", {
  mainid:{
    type:DataTypes.INTEGER,
    primaryKey:true
  },
  title: {
    type: DataTypes.STRING,
  },
  pro_name: {
    type: DataTypes.STRING,
  },
  test_stage: {
    type: DataTypes.STRING,
  },
  medicine: {
    type: DataTypes.STRING,
  },
  indication: {
    type: DataTypes.STRING,
  },
  test_name: {
    type: DataTypes.STRING,
  },
  Deptname: {
    type: DataTypes.STRING,
  },
  medicine_introduce: {
    type: DataTypes.STRING,
  },
  paper: {
    type: DataTypes.STRING,
  },
  medicine_group: {
    type: DataTypes.STRING,
  },
  drug_group: {
    type: DataTypes.STRING,
  },
  medicine_programme: {
    type: DataTypes.STRING,
  },
  briefly_in: {
    type: DataTypes.STRING,
  },
  detail_in: {
    type: DataTypes.STRING,
  },
  briefly_out: {
    type: DataTypes.STRING,
  },
  detail_out: {
    type: DataTypes.STRING,
  },
  gene_id: {
    type: DataTypes.STRING,
  },
  trate_id: {
    type: DataTypes.STRING,
  },
  diease_id: {
    type: DataTypes.STRING,
  },
},{
  //timestamps: false, // 不要默认时间戳 数据库没有时间戳字段时，设置为false，否则报错  SequelizeDatabaseError: Unknown column 'createdAt' in 'field list'
  freezeTableName: true 
});

// 定义数据模型region_main
const region_main = sequelize.define("region_main", {
  regionid:{
    type:DataTypes.INTEGER,
    primaryKey:true
  },
  regionname: {
    type: DataTypes.STRING,
  },
},{
  //timestamps: false, // 不要默认时间戳 数据库没有时间戳字段时，设置为false，否则报错  SequelizeDatabaseError: Unknown column 'createdAt' in 'field list'
  freezeTableName: true 
});

// 定义数据模型region_info
const region_info = sequelize.define("region_info", {
  rid:{
    type:DataTypes.INTEGER,
    primaryKey:true
  },
  regionid:{
    type:DataTypes.INTEGER,
  },
  rname: {
    type: DataTypes.STRING,
  },
},{
  //timestamps: false, // 不要默认时间戳 数据库没有时间戳字段时，设置为false，否则报错  SequelizeDatabaseError: Unknown column 'createdAt' in 'field list'
  freezeTableName: true 
});

// 定义数据模型gene
const gene = sequelize.define("gene", {
  id:{
    type:DataTypes.INTEGER,
    primaryKey:true
  },
  gene_name: {
    type: DataTypes.STRING,
  },
  message: {
    type: DataTypes.STRING,
  },
},{
  //timestamps: false, // 不要默认时间戳 数据库没有时间戳字段时，设置为false，否则报错  SequelizeDatabaseError: Unknown column 'createdAt' in 'field list'
  freezeTableName: true 
});

// 定义数据模型treate
const treatment_require = sequelize.define("treatment_require", {
  id:{
    type:DataTypes.INTEGER,
    primaryKey:true
  },
  treate_name: {
    type: DataTypes.STRING,
  },
  message: {
    type: DataTypes.STRING,
  },
},{
  //timestamps: false, // 不要默认时间戳 数据库没有时间戳字段时，设置为false，否则报错  SequelizeDatabaseError: Unknown column 'createdAt' in 'field list'
  freezeTableName: true 
});

// 定义数据模型disease
const Disease = sequelize.define("Disease", {
  id:{
    type:DataTypes.INTEGER,
    primaryKey:true
  },
  disease_name: {
    type: DataTypes.STRING,
  },
  message: {
    type: DataTypes.STRING,
  },
},{
  //timestamps: false, // 不要默认时间戳 数据库没有时间戳字段时，设置为false，否则报错  SequelizeDatabaseError: Unknown column 'createdAt' in 'field list'
  freezeTableName: true 
});


// 数据库初始化方法
async function init() {
  await Counter.sync({ alter: true });
}

// 导出初始化方法和模型
module.exports = {
  init,
  Counter,
  User,
  Promain,
  region_main,
  region_info,
  gene,
  treatment_require,
  Disease
};
