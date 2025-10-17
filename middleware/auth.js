const jwt = require("jsonwebtoken");

// Hardcoded JWT secret (replace with a strong random string)
const JWT_SECRET = "EntriFullstackwebdevelopment";

module.exports = {
  JWT_SECRET,
  verifyToken: (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // { id, role, email, name }
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token is not valid" });
    }
  },
  permit: (...allowedRoles) => {
    return (req, res, next) => {
      const { role } = req.user || {};
      if (!role || !allowedRoles.includes(role))
        return res.status(403).json({ message: "Forbidden" });
      next();
    };
  },
};
