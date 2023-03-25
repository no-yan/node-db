const Redis = require("ioredis");
const express = require("express");
const path = require("path");

const app = express();

const redis = new Redis({
  port: 6379,
  host: "localhost",
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: false,
});

// const init = async () => {
//   await redis.rpush("users:list", JSON.stringify({ id: 1, name: "alpha" }));
//   await redis.rpush("users:list", JSON.stringify({ id: 2, name: "bravo" }));
//   await redis.rpush("users:list", JSON.stringify({ id: 3, name: "charlie" }));
//   await redis.rpush("users:list", JSON.stringify({ id: 4, name: "delta" }));
// };
const init = async () => {
  await Promise.all([
    redis.set("users:1", JSON.stringify({ id: 1, name: "alpha" })),
    redis.set("users:2", JSON.stringify({ id: 2, name: "bravo" })),
    redis.set("users:3", JSON.stringify({ id: 3, name: "charlie" })),
    redis.set("users:4", JSON.stringify({ id: 4, name: "delta" })),
  ]);
};

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

redis.once("ready", async () => {
  try {
    await init();
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
