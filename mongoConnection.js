const mongoose = require("mongoose");

// Esta funcion simultanea es la que levanta la conexion con nuestro MongoDB local.
const connectMongoDB = async () => {
  try {
    // Le decimos a mongoose que se conecte a la base "backend_clase" en el puerto por defecto (27017)
    await mongoose.connect("mongodb://localhost:27017/backend_clase");
    console.log("Conexión exitosa a MongoDB");
  } catch (error) {
    // Si al Jona o a alguien se le olvida prender el servicio de Mongo, aquí nos avisa, obviamente
    console.error("Error al conectar con MongoDB", error);
  }
};

// Lo exportamos para llamarlo en el index.js justo cuando arranque el servidor
module.exports = connectMongoDB;