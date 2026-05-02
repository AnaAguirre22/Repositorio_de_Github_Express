const mongoose = require("mongoose");

const connectMongoDB = async () => {
  try {
    // Esta es la ruta a tu servidor local y la DB que acabas de crear
    await mongoose.connect("mongodb://localhost:27017/backend_clase");
    console.log("Conexión exitosa a MongoDB");
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error);
  }
};

module.exports = connectMongoDB;