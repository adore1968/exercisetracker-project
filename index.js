const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
let bodyParser = require("body-parser");

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}

// Mongoose Set Up
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Schema = mongoose.Schema;

// User
const userSchema = new Schema({
  username: { type: String, required: true },
});
let userModel = mongoose.model("user", userSchema);

// Exercise
const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: new Date() },
});
let exerciseModel = mongoose.model("exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.use("/", bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let newUser = new userModel({ username: username });
  newUser.save();
  res.json(newUser);
});

app.get("/api/users", (req, res) => {
  userModel.find({}).then((users) => {
    res.json(users);
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let userId = req.params._id;

  exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration,
  };

  // If there is a date add it to the object
  if (req.body.date != "") {
    exerciseObj.date = req.body.date;
  }

  try {
    const userFound = await userModel.findById(userId);
    const newExercise = new exerciseModel(exerciseObj);
    const result = await newExercise.save();
    return res.json({
      _id: userFound._id,
      username: userFound.username,
      description: result.description,
      duration: result.duration,
      date: new Date(result.date).toDateString(),
    });
  } catch (error) {
    return res.json({ error: error.message });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let fromParam = req.query.from;
  let toParam = req.query.to;
  let limitParam = req.query.limit;
  let userId = req.params._id;

  // If limit param exists set it to an integer
  limitParam = limitParam ? parseInt(limitParam) : limitParam;

  try {
    const result = await userModel.findById(userId);
    let queryObj = { userId };

    if (fromParam && toParam) {
      queryObj.date = { $gte: fromParam, $lte: toParam };
    }

    let exercises = await exerciseModel.find(queryObj).limit(limitParam);
    let resObj = { _id: result._id, username: result.username };

    exercises = exercises.map((x) => {
      return {
        description: x.description,
        duration: x.duration,
        date: new Date(x.date).toDateString(),
      };
    });

    resObj.log = exercises;
    resObj.count = exercises.length;
    return res.json(resObj);
  } catch (error) {
    return res.json({ error: error.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
