const mongoose = require('mongoose');
const { Schema, model, SchemaTypes } = mongoose;

const karyawanSchema = new Schema({
    nik: {
        type: String,
        required: true,
    },
    nama: {
        type: String,
        required: true,
    },
    nama_jabatan: {
        type: SchemaTypes.ObjectId,
        ref: 'Jabatan',
        required: true,
    },
    email: {
        type: String,
        unique: true
    },
});

const Karyawan = model('Karyawan', karyawanSchema);
module.exports = Karyawan;  // Menggunakan module.exports
