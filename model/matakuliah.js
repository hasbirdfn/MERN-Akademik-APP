const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const matkulSchema = new Schema({
    matkul: {
        type: String,
    },
});

const Matakuliah = model('Matakuliah', matkulSchema);
module.exports = Matakuliah;  // Menggunakan module.exports
