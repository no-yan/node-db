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
  await redis.rpush("users:list", JSON.stringify({ id: 1, name: "alpha" }));
  await redis.rpush("users:list", JSON.stringify({ id: 2, name: "bravo" }));
  await redis.rpush("users:list", JSON.stringify({ id: 3, name: "charlie" }));
  await redis.rpush("users:list", JSON.stringify({ id: 4, name: "delta" }));
};

app.get("/", (req, res) => {
  res.status(200).send("hello world\n");
});

app.get("/users", async (req, res) => {
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const usersList = await redis.lrange("users:list", offset, offset + 1);

  const users = usersList.map((user) => {
    return JSON.parse(user);
  });

  return { users };
});

app.get("/user/:id", async (req, res) => {
  try {
    const key = `users:${req.params.id}`;
    const val = await redis.get(key);
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
