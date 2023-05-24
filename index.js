// Permet d'activer les variables d'environnement
require("dotenv").config();

//inport des modules
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors"); //permet d'autoriser ou non les demandes provenant de l'extérieur

// permet de lire les parametres body de postman
app.use(express.json());
app.use(cors());

//cree le lien vers la base de donnée
mongoose.connect(process.env.MONGODB_URI);

// import des routes user :
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
// utilisation de ces routes par app :
app.use(userRoutes, offerRoutes);

//GERE LES MAUVAISE ROUTE
app.all("*", (req, res) => {
  try {
    return res.status(404).json("Not found !!!!");
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server on fire 🔥🔥🔥🔥🔥");
});
