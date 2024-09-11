const mongoose = require('mongoose');
const { Schema, model, SchemaTypes } = mongoose;

const dosenSchema = new Schema({
    nip: {
        type: String,
        required: true,
    },
    nama: {
        type: String,
        required: true,
    },
    matkul: {
        type: SchemaTypes.ObjectId,
        ref: 'Matakuliah',
        required: true,
    },
    email: {
        type: String,
    },
});

const Dosen = model('Dosen', dosenSchema);
module.exports = Dosen;  // Menggunakan module.exports
