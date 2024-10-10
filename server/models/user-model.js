const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

//製作學生的 Schema
const userSchema = new Schema({
  username: {
    type: String,
    minlength: 3,
    maxlength: 50,
    required: true,
  },
  email: {
    type: String,
    minlength: 6,
    maxlength: 50,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    //只能有這兩種的列舉角色
    enum: ["student", "instructor"],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//model instance methods
userSchema.methods.isStudent = function () {
  return this.role == "student";
};

userSchema.methods.isInstructor = function () {
  return this.role == "instructor";
};

//比對使用者輸入的密碼與目前這個 doc 的 passoword
userSchema.methods.comparePassword = async function (inputPassword, cb) {
  let result;

  try {
    result = await bcrypt.compare(inputPassword, this.password);
    return cb(null, result);
  } catch (e) {
    return cb(e, result);
  }
};

//mongoose middlewares
//在儲存這個 userSchema 之前的 middleware
//若使用者為新用戶，或者是正在更改密碼，則將密碼進行湊處理
//注意！這裡不能用 arrow express ，不然 this 沒辦法定向到這個 doc
userSchema.pre("save", async function (next) {
  //這個 this 代表 mongoDB 內的 document
  if (this.new || this.isModified("password")) {
    //這是一個新的資料 或者 password 要被修改
    //將密碼進行 hash 處理
    const hashValue = await bcrypt.hash(this.password, 10);
    this.password = hashValue;
  }
  next();
});

// 自訂 toJSON 行為，排除 _id 和 __v
// userSchema.set("toJSON", {
//   transform: (doc, ret) => {
//     delete ret._id; // 刪除 _id
//     delete ret.__v; // 刪除 __v
//     return ret; // 回傳修改後的資料
//   },
// });

module.exports = mongoose.model("User", userSchema);
