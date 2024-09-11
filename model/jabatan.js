const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const jabatanSchema = new Schema({
    nama_jabatan: {
        type: String,
        required: true,
    }
});


const Jabatan = model('Jabatan', jabatanSchema );
module.exports = Jabatan;