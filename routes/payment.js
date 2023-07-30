const express = require("express");
const router = express.Router();
const stripe = require("../config/stripeConfig");
const isAuthentificated = require("../middlewares/isAutentificated");

router.post("/payment", async (req, res) => {
  try {
    const { token, title, amount } = req.body;
    const convertedAmount = Math.round(amount * 100);
    const charge = await stripe.charges.create({
      amount: convertedAmount,
      currency: "eur",
      description: title,
      source: token,
    });

    res.status(200).json({
      success: true,
      message: "Payment successful!",
      charge,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Payment failed",
      error,
    });
  }
});

module.exports = router;
