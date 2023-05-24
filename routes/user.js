//import des modules
const express = require("express");
const SHA256 = require("crypto-js/sha256");
const base64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

//Config cloudinary
cloudinary.config({
  cloud_name: "duccldgqq",
  api_key: "884566411992299",
  api_secret: "xbjjUunsU3qht2sa_3mb3K915dc",
});

//convertir le Buffer en BASE 64
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//Mise en place du router express :
const router = express.Router();

// permet de lire les parametres body de postman
router.use(express.json());

//import des modèles nécessaires à la bonne exécution des routes :
const User = require("../models/User");

//ROUTE DE BASE
router.get("/", (req, res) => {
  try {
    return res.status(200).json("welcome to vinted");
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//ROUTE POUR CREER UN USER
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    function passwordIsGood(value) {
      const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g;
      return regex.test(value);
    }
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json("l'email existe deja");
    }
    if (req.body.email === "") {
      return res.status(400).json("l'email est obligatoire");
    }
    if (req.body.username === "") {
      return res.status(400).json("username est obligatoir");
    }
    if (req.body.username.length > 10) {
      return res.status(400).json("username doit contenir 10 caractère max");
    }
    if (passwordIsGood(req.body.password)) {
      const salt = uid2(10);
      // upload
      const pictureToUpload = convertToBase64(req.files.picture);

      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
        },
        newsletter: req.body.newsletter,
        token: uid2(10),
        hash: SHA256(req.body.password + salt).toString(base64),
        salt: salt,
      });
      const resultPicture = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `vinted/users/${newUser._id}`, // comment recuperer newOffer ID avant declaration de newOffer
      });
      newUser.account.avatar = resultPicture;
      await newUser.save();
      return res.status(200).json(newUser);
    } else {
      return res
        .status(400)
        .json("Le mot de passe ne respecte pas les critères requis");
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//ROUTE POUR LOGUER UN USER
router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      console.log(user);
      const newHash = SHA256(req.body.password + user.salt).toString(base64);
      if (newHash === user.hash) {
        const returnUser = {
          _id: user._id,
          token: user.token,
          account: user.account,
        };
        return res.status(200).json(returnUser);
      } else {
        return res.status(400).json("email ou MDP incorrect");
      }
    } else {
      return res.status(400).json("email ou MDP incorrect");
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//Export de router
module.exports = router;
