const express = require("express");
const app = express();

app.use(express.json());

const VERIFY_TOKEN = "brucke123";

// Ruta principal
app.get("/", (req, res) => {
  res.send("Bot de WhatsApp Brücke activo 🚀");
});

// Verificación webhook Meta
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verificado");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recibir mensajes
app.post("/webhook", (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
