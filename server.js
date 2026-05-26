const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "brucke123";
const ACCESS_TOKEN = "EAAOOoHrGr4wBRuoVZCeSjE81ZApJM0uZCUjcQWNbpMEewmdGZAQ65EQ5JIZB984Bgn1IQZBUrZB4MIS4veqMV0OHnR0liAgPjlDZCWFAJPP54scr5qruTxQi9MagPl3EIgKfZCiuOGMfRrN3IykPxKNeCB27d1j9vJBpUVERL1Hnq62KGcJqZCqlZAiZBrjZCsCYVEnSHhZC0vKZB9JZBzX1u4srAQHNvQyjiTwTtIdwGarMDDQbcro5BmGfu41VHpq3jvqVtBYoFUUk7ZCayj3fystakjreZC2hWF38PueUYZB5hYZD";
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

function obtenerRespuesta(texto) {
  const mensaje = texto.trim().toLowerCase();

  if (mensaje === "1") {
    return "🇺🇸 *Work & Travel USA*\n\nPrograma para estudiantes universitarios que desean trabajar legalmente en Estados Unidos durante sus vacaciones y vivir una experiencia cultural internacional.\n\nRequisitos generales:\n✅ Ser estudiante universitario\n✅ Tener 18 años o más\n✅ Inglés intermedio\n✅ Disponibilidad para temporada de verano o invierno\n\nEscribe *asesor* si deseas que alguien de Brücke te contacte.";
  }

  if (mensaje === "2") {
    return "💼 *Internship USA*\n\nPrograma dirigido a estudiantes avanzados o recién egresados que desean realizar prácticas profesionales en Estados Unidos.\n\nIdeal para áreas como hotelería, gastronomía, turismo, administración y más.\n\nEscribe *asesor* si deseas recibir orientación personalizada.";
  }

  if (mensaje === "3") {
    return "📈 *Training USA*\n\nPrograma para profesionales o egresados que buscan entrenamiento laboral en Estados Unidos para fortalecer su experiencia internacional.\n\nEscribe *asesor* si deseas que revisemos tu perfil.";
  }

  if (mensaje === "4") {
    return "📝 *Evaluación de inglés Brücke*\n\nLa evaluación nos ayuda a conocer tu nivel de inglés y orientarte hacia el programa más adecuado.\n\nUn asesor de Brücke puede indicarte el siguiente paso.";
  }

  if (mensaje.includes("asesor")) {
    return "Perfecto 😊 Un asesor de Brücke revisará tu mensaje y te contactará pronto.\n\nMientras tanto, puedes escribirnos tu nombre completo y el programa de tu interés.";
  }

  return "Hola 👋 Soy el asistente virtual de Brücke Programs.\n\n¿Te interesa?\n\n1️⃣ Work & Travel USA\n2️⃣ Internship USA\n3️⃣ Training USA\n4️⃣ Evaluación de inglés\n\nResponde con el número de la opción.";
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
