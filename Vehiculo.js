const mongoose = require("mongoose");

// Aqui definimos el molde para los carros en Mongo. Es como decirle a la base de datos que datos exactos debe llevar cada vehículo para que no nos metan basura.
const vehiculoSchema = new mongoose.Schema({
  marca: { type: String, required: true },  // required: true significa que es obligatorio
  modelo: { type: String, required: true },
  anio: { type: Number, required: true },   // tiene que ser número sí o sí
  color: { type: String, required: true },
});

// Convertimos nuestro esquema en un modelo real que podemos usar para hacer las consultas 
const Vehiculo = mongoose.model("Vehiculo", vehiculoSchema);

module.exports = Vehiculo;