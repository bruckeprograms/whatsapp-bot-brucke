const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "brucke123";
const ACCESS_TOKEN = "EAAOOoHrGr4wBRuoVZCeSjE81ZApJM0uZCUjcQWNbpMEewmdGZAQ65EQ5JIZB984Bgn1IQZBUrZB4MIS4veqMV0OHnR0liAgPjlDZCWFAJPP54scr5qruTxQi9MagPl3EIgKfZCiuOGMfRrN3IykPxKNeCB27d1j9vJBpUVERL1Hnq62KGcJqZCqlZAiZBrjZCsCYVEnSHhZC0vKZB9JZBzX1u4srAQHNvQyjiTwTtIdwGarMDDQbcro5BmGfu41VHpq3jvqVtBYoFUUk7ZCayj3fystakjreZC2hWF38PueUYZB5hYZD";

// Verificación webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// Recibir mensajes
app.post("/webhook", async (req, res) => {
  try {

    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {

      const from = message.from;
      const text = message.text?.body || "";

      console.log("Mensaje recibido:", text);

      let respuesta =
        "Hola 👋 Soy el asistente virtual de Brücke Programs.\n\n¿Te interesa:\n1️⃣ Work & Travel USA\n2️⃣ Internship USA\n3️⃣ Training USA\n4️⃣ Evaluación de inglés";

      await axios.post(
        "https://graph.facebook.com/v25.0/1171925102662702/messages",
        {
          messaging_product: "whatsapp",
          to: from,
          text: {
            body: respuesta
          }
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

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
