// panggil monggose utk koneksi kedalam database mongodb
const mongoose = require('mongoose');
const { type } = require('os');
const { stringify } = require('querystring');
mongoose.connect('mongodb://127.0.0.1:27017/wpu',{
    useNewUrlParser : true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});


// // menambah 1 data
// const jabatan1 = new Jabatan({
//     nama_jabatan : 'Human Capital',
// });

// jabatan1.save().then((jabatan) => console.log(jabatan));