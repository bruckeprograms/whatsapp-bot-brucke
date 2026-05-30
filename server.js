const express = require("express");
const axios = require("axios");
const content = require("./bot-content.json");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "brucke123";
const ACCESS_TOKEN = "EAAOOoHrGr4wBRoh9vjams4SOUjAhfI2YoZBooPG27awHrgwAIrQDperZB7kxdt5kUZBZBUr3LPSFwyw66kTbrgkY3ATo7N9n2HjmnLiP33dgZByiRlRdAQ0VhKl1ZBM4J3gKBDMkGasBzZCSOlcdDPzdyUIOlcFbQmhdtLLiQHqrHx2A0mrQD4bjpR9pBWT9wGWk9tyFdXrZANfZCL3mXJJL1UNLHcIMoaAbx7lcdprhXQdYT0oxNbiDjV58LIJ2ADzwzOEliZAMOUCf1F3HINyliBgX9FNgQUKGZAMD5P2";
const PHONE_NUMBER_ID = "1171925102662702";

const sesiones = {};
const mensajesProcesados = {};
const DOS_HORAS = 2 * 60 * 60 * 1000;

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

function obtenerSesion(numero) {
  const ahora = Date.now();

  if (!sesiones[numero]) {
    sesiones[numero] = {
      estado: "menu_principal",
      programa: null,
      modoAsesor: false,
      ultimaInteraccion: 0,
      errores: 0,
      primerContacto: true
    };
  }

  const sesion = sesiones[numero];

  if (sesion.ultimaInteraccion && ahora - sesion.ultimaInteraccion > DOS_HORAS) {
    sesion.estado = "menu_principal";
    sesion.modoAsesor = false;
    sesion.errores = 0;
    sesion.primerContacto = true;
  }

  return sesion;
}

function actualizarTiempo(sesion) {
  sesion.ultimaInteraccion = Date.now();
}

function esReset(texto) {
  const t = texto.trim().toLowerCase();
  return ["menu", "menú", "inicio", "reiniciar", "volver al inicio"].includes(t);
}

function esCerrar(texto) {
  return texto.trim().toLowerCase() === "#cerrar";
}

function mensajeNoEntendido() {
  return "😅 No logré entender tu mensaje.\n\nPor favor selecciona una opción del menú actual o escribe *menu* para volver al menú principal.";
}

function respuestaArchivo() {
  return "📎 Hemos recibido un archivo o documento.\n\nPara asegurar una correcta revisión, los documentos, comprobantes o archivos deben enviarse por uno de estos medios:\n\n📩 Correo:\ninfo@bruckeprograms.com\n\nO\n\n📲 WhatsApp directo con tu asesor personal de Brücke, si ya tienes uno asignado.\n\nSi aún no tienes asesor asignado, escribe *asesor* y te orientaremos.";
}

function procesarTexto(numero, texto) {
  const sesion = obtenerSesion(numero);
  const mensaje = texto.trim().toLowerCase();

  if (esCerrar(mensaje)) {
    sesion.estado = "menu_principal";
    sesion.modoAsesor = false;
    sesion.errores = 0;
    sesion.primerContacto = true;
    actualizarTiempo(sesion);
    return null;
  }

  if (esReset(mensaje)) {
    sesion.estado = "menu_principal";
    sesion.modoAsesor = false;
    sesion.errores = 0;
    sesion.primerContacto = false;
    actualizarTiempo(sesion);
    return content["menu_principal"].mensaje;
  }

  if (sesion.primerContacto) {
    sesion.estado = "menu_principal";
    sesion.modoAsesor = false;
    sesion.errores = 0;
    sesion.primerContacto = false;
    actualizarTiempo(sesion);
    return content["menu_principal"].mensaje;
  }

  if (sesion.modoAsesor) {
    actualizarTiempo(sesion);
    return null;
  }

  if (mensaje.includes("asesor")) {
    sesion.modoAsesor = true;
    actualizarTiempo(sesion);
    return content["asesor"]?.mensaje || content["asesor"];
  }

  const estadoActual = content[sesion.estado];

  if (!estadoActual) {
    sesion.estado = "menu_principal";
    actualizarTiempo(sesion);
    return content["menu_principal"].mensaje;
  }

  const siguienteEstado = estadoActual.opciones?.[mensaje];

  if (!siguienteEstado) {
    sesion.errores += 1;
    actualizarTiempo(sesion);

    if (sesion.errores >= 3) {
      sesion.modoAsesor = true;
      return "😊 Parece que necesitas ayuda adicional.\n\nPor favor explícanos brevemente tu consulta y un asesor continuará contigo en breve.\n\n📌 Si deseas volver a ver las opciones del bot, escribe *menu* en cualquier momento.";
    }

    return mensajeNoEntendido();
  }

  sesion.errores = 0;
  sesion.estado = siguienteEstado;

  const nuevoEstado = content[siguienteEstado];

  if (!nuevoEstado) {
    sesion.estado = "menu_principal";
    actualizarTiempo(sesion);
    return content["menu_principal"].mensaje;
  }

  if (nuevoEstado.programa) {
    sesion.programa = nuevoEstado.programa;
  }

  if (nuevoEstado.modoAsesor) {
    sesion.modoAsesor = true;
  }

  if (nuevoEstado.fin) {
    sesion.modoAsesor = true;
  }

  actualizarTiempo(sesion);
  return nuevoEstado.mensaje;
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
      const messageId = message.id;

      if (messageId && mensajesProcesados[messageId]) {
        return res.sendStatus(200);
      }

      if (messageId) {
        mensajesProcesados[messageId] = true;
      }

      const from = message.from;
      let respuesta = null;

      if (message.type === "text") {
        const text = message.text?.body || "";
        console.log("Mensaje recibido:", text);
        respuesta = procesarTexto(from, text);
      } else {
        console.log("Archivo o multimedia recibido:", message.type);
        respuesta = respuestaArchivo();

        const sesion = obtenerSesion(from);
        sesion.modoAsesor = true;
        sesion.primerContacto = false;
        actualizarTiempo(sesion);
      }

      if (respuesta) {
        await enviarMensaje(from, respuesta);
      }
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
