const mongoose = require('mongoose');

const Contact = mongoose.model('Contact', {
    nama : {
        type : String,
        required: true
    },
    lulusan : {
        type : String,
    },
    nohp : {
        type : String,
        required: true
    },
    email : {
        type : String,
        unique: true,
    },
    alamat : {
        type : String,
    },
});

module.exports = Contact;