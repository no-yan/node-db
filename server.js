const Redis = require("ioredis");
const express = require("express");
const path = require("path");
const redis = require("./lib/redis");

const app = express();

app.use("/static", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render(path.join(__dirname, "views", "index.ejs"));
});

app.get("/users", async (req, res) => {
  try {
    const stream = redis.scanStream({
      match: "users:*",
      count: 2,
    });
    const users = [];
    for await (const resultKeys of stream) {
      for (const key of resultKeys) {
        const value = await redis.get(key);
        if (value === null) {
          throw new Error("value in invalid");
        }
        const user = JSON.parse(value);
        users.push(user);
      }
    }
    res.render(path.join(__dirname, "views", "users.ejs"), { users: users });
  } catch (err) {
    console.error(err);
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    const key = `users:${req.params.id}`;
    const val = await redis.get(key);
    if (val === null) {
      throw Error("id not found");
    }
    const user = JSON.parse(val);
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

redis.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
