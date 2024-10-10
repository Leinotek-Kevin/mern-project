const router = require("express").Router();
const Course = require("../models").Course;
const courseValidation = require("../validation").courseValidation;

router.use((req, res, next) => {
  console.log("course route 正在接受一個 request");
  next();
});

//獲得系統中的所有課程
router.get("/", async (req, res) => {
  try {
    let courseFounds = await Course.find({})
      //populate 可以根據外鍵（參考ID）將相關聯的文檔從另一個集合中「填充」到當前查詢結果中
      //，而不必手動去執行多次查詢
      //因為 instructor 有關聯到 User Collection ,
      //透過 populate 就可以用 _id 去找 User Collection 的 User ,
      //並指定要填充的資料
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFounds);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用課程 id 尋找課程
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id })
      .populate("instructor", ["email"])
      .exec();
    if (!courseFound) {
      return res.status(400).send({
        message: "查無此課程",
      });
    }
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用課程名稱來尋找課程
router.get("/findByName/:name", async (req, res) => {
  let { name } = req.params;
  try {
    let courseFound = await Course.find({ title: name })
      .populate("instructor", ["email", "username"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用學生 id 來尋找課程
router.get("/student/:_student_id", async (req, res) => {
  let { _student_id } = req.params;
  let courseFound = await Course.find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(courseFound);
});

//用講師 id 來尋找課程
router.get("/instructor/:_instructor_id", async (req, res) => {
  let { _instructor_id } = req.params;
  let courseFound = await Course.find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(courseFound);
});

//讓學生透過課程 id 來註冊新課程
router.post("/enroll", async (req, res) => {
  let { _id } = req.body;
  try {
    let course = await Course.findOne({ _id });
    //如果有登入的話，api 一定會過 jwt ，所以經過 passport done 後
    //req.user 會有 使用者的資料
    course.students.push(req.user._id);
    await course.save();
    return res.send("註冊完成");
  } catch (e) {
    return res.send(e);
  }
});

//更改課程
router.patch("/:_id", async (req, res) => {
  //驗證數據符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  let { _id } = req.params;
  //要確認課程是否存在
  try {
    let courseFound = await Course.findOne({ _id }).exec();
    if (!courseFound) {
      return res.status(400).send("找不到課程！無法更新課程內容");
    }
    //使用者必須是此課程講師，才能編輯課程
    if (courseFound.instructor.equals(req.user._id)) {
      let updateCourse = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      });

      return res.send({
        message: "課程已被更新成功",
        updateCourse,
      });
    } else {
      return res.status(403).send("只有此課程的講師才能編輯課程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

//刪除課程
router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  //要確認課程是否存在
  try {
    let courseFound = await Course.findOne({ _id }).exec();
    if (!courseFound) {
      return res.status(400).send("找不到課程！無法刪除課程內容");
    }
    //使用者必須是此課程講師，才能刪除課程
    if (courseFound.instructor.equals(req.user._id)) {
      let updateCourse = await Course.deleteOne({ _id });

      return res.send({
        message: "課程已被刪除成功",
      });
    } else {
      return res.status(403).send("只有此課程的講師才能刪除課程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.post("/", async (req, res) => {
  //驗證數據符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.isStudent()) {
    return res
      .status(400)
      .send("只有講師才能發佈新課程。若你已經是講師，請透過講師帳號登入");
  }

  let { title, description, price } = req.body;
  try {
    let newCourse = new Course({
      title,
      description,
      price,
      instructor: req.user._id,
    });
    let saveCourse = await newCourse.save();
    return res.send({
      message: "新課程已經保存",
    });
  } catch (e) {
    return res.status(500).send("無法創建課程");
  }
});

module.exports = router;
