//Import des modules
const mongoose = require("mongoose");

//cree la collection USER
const User = mongoose.model("User", {
  email: String,
  account: {
    username: String,
    avatar: Object, // nous verrons plus tard comment uploader une image
  },
  newsletter: Boolean,
  token: String,
  hash: String,
  salt: String,
});

//Export du module USER
module.exports = User;
