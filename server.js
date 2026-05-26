const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "brucke123";
const ACCESS_TOKEN = "EAAOOoHrGr4wBRjyFgQMUJdmlftNTynoE505JOw5qbs3ncUPfIhVv62OFYtSbnBhSD3G35zufwgLelvt1z3cCImL0AyO0ZCkZACbWjTh8Vhg9vZCEY2ODaAdV48QZCZBRebBg9BHg5NZBmnpHvwEJOO917R6A8jNnZARMhG64kKtlc5lbwuzFbK4asykodAKxPIzWSz1dsfxVo6gYAbBXUBrAjziWgljYLdvKpTL3grre7imeXJbeuZAu954BWL797YXrZBpzDf0Xdc71IjeILUZB2KM4bixiFxvZBMxscgZD";
const PHONE_NUMBER_ID = "1171925102662702";

app.get("/", (req, res) => {
  res.send("Bot de WhatsApp Brücke activo 🚀");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

const content = require("./bot-content.json");

function obtenerRespuesta(texto) {

  const mensaje = texto.trim().toLowerCase();

  if (mensaje.includes("asesor")) {
    return content["asesor"];
  }

  return content[mensaje] || content["menu"];
}

async function enviarMensaje(to, body) {
  await axios.post(
    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "";

      console.log("Mensaje recibido:", text);

      const respuesta = obtenerRespuesta(text);
      await enviarMensaje(from, respuesta);
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado puerto ${PORT}`);
});
