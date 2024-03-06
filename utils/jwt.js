const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
  // console.log("inside verify token", req.headers?.authorization);
  if (!req.headers?.authorization) {
    return res.status(404).send({ message: "Permission token not Found" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

module.exports = { verifyToken };
