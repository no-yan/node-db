const Redis = require("ioredis");
const express = require("express");
const path = require("path");
const redis = require("./lib/redis");

const app = express();

app.use("/static", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render(path.join(__dirname, "views", "index.ejs"));
});

const usersHandler = require("./handlers/users");

app.get("/users", async (req, res) => {
  try {
    const locals = await usersHandler.getUsers(req);
    res.render(path.join(__dirname, "views", "users.ejs"), locals);
  } catch (err) {
    console.error(err);
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    const user = await usersHandler.getUser(req);
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("internal error");
  }
});

redis.connect().once("ready", async () => {
  try {
    await redis.init();
    app.listen(3000, () => {
      console.log("start listening");
    });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
});

redis.getClient().on("error", (err) => {
  console.error(err);
  process.exit(1);
});
