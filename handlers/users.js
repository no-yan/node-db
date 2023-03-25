const redis = require("../lib/redis");
/**
 *
 * @param {import("../node_modules/@types/express/").Request} req
 * @returns {Promise<{id: number, name: string}>}
 */
const getUser = async (req) => {
  // @ts-expect-error
  const key = `users:${req.params.id}`;
  const val = await redis.getClient().get(key);
  if (val === null) {
    throw Error("id not found");
  }
  const user = JSON.parse(val);
  return user;
};

exports.getUser = getUser;

/**
 * @param {import("../node_modules/@types/express/").Request} req
 * @returns {Promise<{users: string[]}>}
 */
const getUsers = async (req) => {
  const stream = redis.getClient().scanStream({
    match: "users:*",
    count: 2,
  });
  const users = [];
  for await (const resultKeys of stream) {
    for (const key of resultKeys) {
      const value = await redis.getClient().get(key);
      if (value === null) {
        throw new Error("value in invalid");
      }
      const user = JSON.parse(value);
      users.push(user);
    }
  }
  return { users };
};
exports.getUsers = getUsers;
