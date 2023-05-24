const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // Etape 1 : récupérer le token :
  console.log(req.headers.authorization); // Bearer Y2rWpV_4n3PvO3gV
  // Etape 2 : retirer le "Bearer " devant celui-ci :
  const sentToken = req.headers.authorization.replace("Bearer ", "");
  // Etape 3 : chercher la correspondance du token avec un utilisateur de la BDD
  const userFound = await User.findOne({ token: sentToken });
  if (userFound) {
    req.user = userFound;
    await next();
  } else {
    console.log("dans le esle");
    return res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;
