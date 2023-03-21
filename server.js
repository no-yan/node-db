const Redis = require("ioredis");
const express = require("express");
const app = express();

const redis = new Redis({
  port: 6379,
  host: "localhost",
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: false,
});

const init = async () => {
  await Promise.all([
    redis.set("users:1", JSON.stringify({ id: 1, name: "alpha" })),
    redis.set("users:2", JSON.stringify({ id: 2, name: "bravo" })),
    redis.set("users:3", JSON.stringify({ id: 3, name: "charlie" })),
    redis.set("users:4", JSON.stringify({ id: 4, name: "delta" })),
  ]);
};

app.get("/", (req, res) => {
  res.status(200).send("hello world\n");
});

app.get("/user/:id", (req, res) => {
  res.status(200).send(req.params.id);
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
