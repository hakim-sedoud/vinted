//import des modules
const express = require("express");
const base64 = require("crypto-js/enc-base64");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

//Mise en place du router express :
const router = express.Router();

// permet de lire les parametres body de postman
router.use(express.json());

//import des modèles nécessaires à la bonne exécution des routes :
//const User = require("../models/User");
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAutentificated");

//Config cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

//convertir le Buffer en BASE 64
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//ROUTE POUR PUBLIER UNE OFFRE
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const reqBody = req.body;
      const tab = [
        { Condition: reqBody.condition },
        { City: reqBody.city },
        { Brand: reqBody.brand },
        { Size: reqBody.size },
        { Color: reqBody.color },
      ];
      // upload
      const pictureToUpload = convertToBase64(req.files.picture);
      //condition
      if (req.body.title.length > 50) {
        return res
          .status(400)
          .json({ message: "Le titre doit contenir max 50 caractere" });
      }
      if (req.body.description.length > 500) {
        return res
          .status(400)
          .json({ message: "La description doit contenir max 500 caractere" });
      }
      if (req.body.price > 100000) {
        return res
          .status(400)
          .json({ message: "le prix dois etre inferieur à 100000" });
      }
      //creation de l'offre
      const newOffer = new Offer({
        product_name: reqBody.title,
        product_description: reqBody.description,
        product_price: reqBody.price,
        product_details: tab,
        owner: req.user,
      });
      const resultPicture = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `vinted/offers/${newOffer._id}`, //  recuperer newOffer ID avant la sauvegarde de newOffer
      });
      newOffer.product_image = resultPicture;
      await newOffer.save();
      return res.status(200).json("Offre créé");
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
);

//ROUTE POUR MODIFIER UNE OFFRE
router.put("/offer/upload", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.body.id);
    console.log(offer);
    //console.log(offer.product_details[0]);

    if (req.body.title) {
      offer.product_name = req.body.title;
    }
    if (req.body.description) {
      offer.product_description = req.body.description;
    }
    if (req.body.price) {
      offer.product_price = req.body.price;
    }
    if (req.body.condition) {
      offer.product_details[0].Condition = req.body.condition;
    }
    if (req.body.city) {
      offer.product_details[1].City = req.body.city;
    }
    if (req.body.brand) {
      offer.product_details[2].Brand = req.body.brand;
    }
    if (req.body.size) {
      offer.product_details[3].Size = req.body.size;
    }
    if (req.body.color) {
      offer.product_details[4].Color = req.body.color;
    }
    if (req.files.picture) {
      const result = await cloudinary.uploader.destroy(
        offer.product_image.public_id
      );
      const pictureToUpload = convertToBase64(req.files.picture);
      const resultPicture = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `vinted/offers`, // comment recuperer newOffer ID avant declaration de newOffer
      });
      offer.product_image = resultPicture;
    }
    offer.markModified("product_details");
    await offer.save();
    return res.status(200).json({ message: "route UPLOAD" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//ROUTE POUR SUP UNE OFFRE
router.delete(
  "/offer/delete",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const sentToken = req.headers.authorization.replace("Bearer ", "");
      console.log(sentToken);
      console.log(req.user.token);
      if (req.user.token === sentToken) {
        const offer = await Offer.findByIdAndDelete(req.body.id);
        if (offer) {
          const result = await cloudinary.uploader.destroy(
            offer.product_image.public_id
          );
          return res.status(200).json({ message: "route DELETE" });
        } else {
          return res.status(401).json("cet ID n'existe pas ");
        }
      } else {
        return res.status(401).json("Unauthorized");
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
);
// ROUTE POUR AFFICHER DES OFFRES SELONT LES FILTRES
router.get("/offers", async (req, res) => {
  try {
    const regex = new RegExp(req.query.title, "i");
    const filter = {
      product_name: regex,
    };
    if (req.query.priceMin && req.query.priceMax) {
      filter.product_price = {
        $gte: req.query.priceMin,
        $lte: req.query.priceMax,
      };
    } else if (req.query.priceMin) {
      filter.product_price = {
        $gte: req.query.priceMin,
      };
    } else if (req.query.priceMax) {
      filter.product_price = {
        $lte: req.query.priceMax,
      };
    }
    console.log(filter);
    let page = req.query.page;
    const limit = 5;
    if (!page) {
      page = 1;
    }
    const filterPrice = req.query.sort;
    const skip = (page - 1) * limit;
    const offers = await Offer.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ product_price: filterPrice })
      .populate({ path: "owner", select: "acount" });
    //console.log(offers);
    const count = await Offer.countDocuments(filter);
    return res.status(200).json({ count, offers });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//ROUTE POUR RECUPERER LES DETAIL D'UNE OFFRE SELON SON ID
router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate("owner");
    const orderOffer = {
      product_details: offer.product_details,
      _id: offer._id,
      product_name: offer.product_name,
      product_description: offer.product_description,
      product_price: offer.product_price,
      owner: { account: offer.owner.account, _id: offer.owner._id },
      product_image: offer.product_image,
    };
    console.log(orderOffer);
    return res.status(200).json(orderOffer);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//Export de router
module.exports = router;
