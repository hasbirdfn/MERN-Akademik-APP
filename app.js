const express = require('express'); // express
const expressLayouts = require('express-ejs-layouts')// template ejs
const {body, validationResult,check} = require('express-validator') // npm validator
const methodOverride = require('method-override'); // put,update,delete(api)

// Flash Massage
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');


require('./utils/db'); // konfigurasi koneksi
const Contact = require('./model/contact'); // model
const Dosen = require('./model/dosen'); // model
const Matakuliah = require('./model/matakuliah'); // model
const Karyawan = require('./model/karyawan'); // model
const Jabatan = require('./model/jabatan'); // model

const app = express();
const port = 3000;

//set up method override
app.use(methodOverride('_method'))

//set up view engine
app.set('view engine', 'ejs');// Using set ejs
app.use(expressLayouts); // third-party-middleware
app.use(express.static('public')); // built-in-middleware
app.use(express.urlencoded({extended: true})); // built-in-middleware untuk post data kirim

//konsigarasi flash
app.use(cookieParser('secret'));
app.use(session({
    cookie : {maxAge: 6000},
    secret:'secret',
    resave:true,
    saveUninitialized:true,
}));

app.use(flash());

//view home
app.get('/', (req, res) => {
    res.render('index', {
        content : 'Halaman Utama', 
        title: 'Halaman Home',
        layout : 'layouts/main-layout',
    });
});

//view about
app.get('/about', (req, res) => {
    res.render('about', {
        layout : 'layouts/main-layout',
        title : 'Halaman About',
    });
});

//view contact alumni
app.get('/contact', async (req,res) => {

    const contacts = await Contact.find().sort({nama : 1});

    res.render('contact', {
        title : 'Halaman Daftar Contact',
        layout: 'layouts/main-layout',
        contacts,
        msg:req.flash('msg')
    })
}); 

//menampilkan view Form add data
app.get('/contact/add', (req,res) => {
    res.render('add-contact', {
     title: 'Form Tambah Data Contact',
     layout: 'layouts/main-layout',
    });
 });

// //process add data contact
app.post('/contact', [
    body('nama').custom( async (value) => {
        const duplikat = await Contact.findOne({nama: value});
        if(duplikat) {
            throw new Error('Nama Contact sudah terdaftar!');
        }
        return true; // jika namanya beda, maka dibiarkan
    }),
    check('lulusan', 'Lulusan tidak valid!'),
    check('email', 'Email tidak valid!').isEmail(), // apabila emainya salah
    check('nohp','No HP tidak valid !').isMobilePhone('id-ID'),
    check('alamat','Alamat tidak valid!'),
], (req,res) => {
    //tangkap dulu errors nya
    const errors = validationResult(req);
    if(!errors.isEmpty()) {

        res.render('add-contact', {
            title: 'Form Tambah Data Contact',
            layout: 'layouts/main-layout',
            errors: errors.array(),
        });
    } else {
        Contact.insertMany(req.body, (error, result) => {
            req.flash('msg', 'Data contact berhasil ditambahkan!'); // maka menampilkan pesan alert
            res.redirect('/contact');
        });
    }
});

//form process delete
app.delete('/contact', (req, res) => {
   Contact.deleteOne({nama : req.body.nama}).then((result) => {
    req.flash('msg', 'Data contact berhasil dihapus!');
    res.redirect('/contact'); 
   });
});

//view Update
// form ubah contact
app.get('/contact/edit/:nama', async (req,res) => {
   const contact = await Contact.findOne({nama : req.params.nama});

    res.render('edit-contact', {
     title: 'Form Ubah Data Contact',
     layout: 'layouts/main-layout',
     contact, 
    });
 });

 //process update data
 app.put('/contact', [
    body('nama').custom(async(value, {req}) => {
        const duplikat = await Contact.findOne({nama: value});  
        if(value !== req.body.oldNama && duplikat) {
            throw new Error('Nama Contact sudah terdaftar!');
        }
        return true; 
    }),
    check('lulusan', 'Lulusan tidak valid!'),
    check('email', 'Email tidak valid!').isEmail(), 
    check('nohp','No HP tidak valid !').isMobilePhone('id-ID'),
    check('alamat','Alamat tidak valid!'),
], (req,res) => {
    //tangkap dulu errors nya
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        // return res.status(400).json({errors: errors.array()});
        // jika error maka kembali ke halaman /contact
        res.render('edit-contact', {
            title: 'Form Ubah Data Contact',
            layout: 'layouts/main-layout',
            errors: errors.array(),
            contact : req.body, // walaupun ada error, supaya tetap ada isi setiap coloumn (value)
        });
    } else {
        Contact.updateOne({_id: req.body._id}, 
            {
                $set: {
                nama: req.body.nama,
                lulusan: req.body.lulusan,
                email: req.body.email,
                nohp: req.body.nohp,
                alamat: req.body.alamat,
            },
        }
        ).then((result) =>{
            req.flash('msg', 'Data contact berhasil diubah!'); // maka menampilkan pesan alert
            res.redirect('/contact'); // kirim ke halaman contact
        }); 
    }         
}
);

//view Detail Contact
app.get('/contact/:nama', async (req,res) => {
    const contact = await Contact.findOne({ // mencari berdasarkan nama
        nama: req.params.nama
    })

    res.render('detail', {
        title : 'Halaman Detail Contact',
        layout : 'layouts/main-layout',
        contact,
    });
});

// Routes Dosen
app.get('/dosen', async (req, res) => {
    try {
        const dosenList = await Dosen.find().populate('matkul').sort({ nip: 1 });
        res.render('dosen', {
            title: 'Daftar Dosen',
            layout: 'layouts/main-layout',
            dosens: dosenList,
            msg: req.flash('msg')
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching dosen data');
    }
});


// Routes dosen
// View Add Data Dosen
app.get('/dosen/add', async (req, res) => {
    try {
        const matkulList = await Matakuliah.find();
        res.render('add-dosen', {
            title: 'Form Tambah Data Dosen',
            layout: 'layouts/main-layout',
            matkulList
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching matkul data');
    }
});

// Proccess Add data dosen
app.post('/dosen', [
    body('nip')
    .isLength({max : 7}).withMessage('NIP tidak boleh lebih dari 7 angka!')
    .isNumeric().withMessage('NIP harus berupa angka!')
    .custom(async (value) => {
        const duplikatNIP = await Dosen.findOne({nip: value});
        if(duplikatNIP) {
            throw new Error('NIP Dosen sudah terdaftar!');
        }
        return true;
    }),
    body('nama').custom(async (value) => {
        const duplikat = await Dosen.findOne({nama: value});
        if(duplikat) {
            throw new Error('Nama Dosen sudah terdaftar!');
        }
        return true;
    }),
    body('matkul').custom(async (value) => {
        const matkulExists = await Matakuliah.findById(value); // dicari berdasarkan id
        if(!matkulExists) {
            throw new Error('Matakuliah tidak valid!');
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail()
        .custom(async (value) => {
            const duplikatEmail = await Dosen.findOne({ email: value });
            if (duplikatEmail) {
                throw new Error('Email sudah digunakan!');
            }
            return true;
        }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const matkulList = await Matakuliah.find();
        res.render('add-dosen', {
            title: 'Form Tambah Data Dosen',
            layout: 'layouts/main-layout',
            errors: errors.array(),
            matkulList,
        });
    } else {
        Dosen.create(req.body, (error, result) => {
            req.flash('msg', 'Data dosen berhasil ditambahkan!');
            res.redirect('/dosen');
        });
    }
});

// Proccess Delete Data Dosen
app.delete('/dosen', (req,res) => {
    Dosen.deleteOne({nama: req.body.nama}).then((result) => {
        req.flash('msg', 'Data dosen berhasil dihapus!');
        res.redirect('/dosen');
    });
})

app.get('/dosen/edit/:nama', async (req, res) => {
    const dosen = await Dosen.findOne({nama: req.params.nama}).populate('matkul');
    const matkulList = await Matakuliah.find();
    
    res.render('edit-dosen', {
        title: 'Form Ubah Data Dosen',
        layout: 'layouts/main-layout',
        dosen,
        matkulList,
    });
});

app.put('/dosen', [
    body('nip')
    .isLength({max : 7}).withMessage('NIP tidak boleh lebih dari 7 angka!')
    .custom(async (value, { req }) => {
        const duplikatNIP = await Dosen.findOne({nip: value});
        if (value !== req.body.oldNIP && duplikatNIP) {
            throw new Error('NIP Dosen sudah terdaftar!');
        }
        return true;
    }),
    body('nama')
    .matches(/^[A-Za-z\s]+$/).withMessage('Nama hanya boleh berisi huruf dan spasi')
    .custom(async (value, { req }) => {
        const duplikat = await Dosen.findOne({nama: value});
        if (value !== req.body.oldNama && duplikat) {
            throw new Error('Nama Dosen sudah terdaftar!');
        }
        return true;
    }),
    body('matkul').custom(async (value) => {
        const matkulExists = await Matakuliah.findById(value);
        if (!matkulExists) {
            throw new Error('Mata Kuliah tidak valid!');
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail()
        .custom(async (value, {req}) => {
            const duplikatEmail = await Dosen.findOne({ email: value });
            if (value !== req.body.oldEmail && duplikatEmail) {
                throw new Error('Email sudah digunakan!');
            }
            return true;
        }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const matkulList = await Matakuliah.find();
        res.render('edit-dosen', {
            title: 'Form Ubah Data Dosen',
            layout: 'layouts/main-layout',
            errors: errors.array(),
            dosen: req.body,
            matkulList,
        });
    } else {
        Dosen.updateOne({_id: req.body._id}, 
            {
            $set: {
                nip: req.body.nip,
                nama: req.body.nama,
                matkul: req.body.matkul,
                email: req.body.email,
            },
        }).then(() => {
            req.flash('msg', 'Data Dosen berhasil diubah!');
            res.redirect('/dosen');
        });
    }
});
 

// view Detail Dosen
app.get('/dosen/:nama', async (req, res) => {
    try {
        const dosen = await Dosen.findOne({ nama: req.params.nama })
            .populate('matkul'); // Pastikan `matkul` dipopulasi dengan data dari koleksi Matakuliah

        if (!dosen) {
            return res.status(404).send('Dosen tidak ditemukan');
        }

        res.render('detail-dosen', {
            title: 'Halaman Detail Dosen',
            layout: 'layouts/main-layout',
            dosen,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching dosen data');
    }
});


// Routes Karyawan
app.get('/karyawan', async (req, res) => {
    const karyawanList = await Karyawan.find().populate('nama_jabatan').sort({ nik: 1 });
    res.render('karyawan', {
        title: 'Daftar karyawan',
        layout: 'layouts/main-layout',
        karyawans: karyawanList,
        msg: req.flash('msg')
    });
});

// Halaman Add Karyawan
app.get('/karyawan/add', async (req,res) =>{
const jabatanList = await Jabatan.find(); // menampilkan ke halaman view
res.render('add-karyawan', {
    title: 'Halaman Data Karyawan',
    layout: 'layouts/main-layout',
    jabatanList,
})
})

// process add Karyawan
app.post('/karyawan', [
body('nik')
.isLength({max : 7}).withMessage('NIP tidak boleh lebih dari 7 angka!')
.isNumeric().withMessage('NIP harus berupa angka!')
.custom(async (value) => {
    const duplikatNIK = await Karyawan.findOne({nik: value});
    if(duplikatNIK) {
        throw new Error('NIK karyawan sudah terdaftar!');
    }
    return true;
}),
body('nama').custom(async (value) => {
    const duplikat = await Karyawan.findOne({nama: value});
    if(duplikat) {
        throw new Error('Nama karyawan sudah terdaftar!');
    }
    return true;
}),
body('nama_jabatan').custom(async (value) => {
    const jabatanExists = await Jabatan.findById(value); // dicari berdasarkan id
    if(!jabatanExists) {
        throw new Error('Jabatan tidak valid!');
    }
    return true;
}),
    check('email', 'Email tidak valid!').isEmail()
    .custom(async (value, {req}) => {
        const duplikatEmail = await Karyawan.findOne({ email: value });
        if (value !== req.body.oldEmail && duplikatEmail) {
            throw new Error('Email sudah digunakan!');
        }
        return true;
    }),
], async (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) {
    const jabatanList = await Jabatan.find();
    res.render('add-karyawan', {
        title: 'Form Tambah Data karyawan',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        jabatanList,
    });
} else {
    Karyawan.create(req.body, (error, result) => {
        req.flash('msg', 'Data karyawan berhasil ditambahkan!');
        res.redirect('/karyawan');
    });
}
});

// process delete data karyawan
app.delete('/karyawan', (req,res) => {
Karyawan.deleteOne({nama : req.body.nama}).then((result) =>{
    req.flash('msg', 'Data Karyawan berhasil dihapus!');
    res.redirect('/karyawan');
});
});
//view detail karyawan
app.get('/karyawan/:nama', async (req, res) => {
const karyawan = await Karyawan.findOne({ nama: req.params.nama })
    .populate('nama_jabatan'); // Pastikan `nama_jabatan` dipopulasi dengan data dari koleksi Jabatan

res.render('detail-karyawan', {
    title: 'Halaman Detail karyawan',
    layout: 'layouts/main-layout',
    karyawan,
});
});
   
// View Edit karyawan
app.get('/karyawan/edit/:nama', async(req,res) =>{
    const karyawan = await Karyawan.findOne({nama : req.params.nama}).populate('nama_jabatan');
    const jabatanList = await Jabatan.find();

    res.render('edit-karyawan', {
        title: 'Halaman Edit Karyawan',
        layout: 'layouts/main-layout',
        karyawan,
        jabatanList,
    });
});

app.put('/karyawan', [
    body('nik')
    .isLength({max : 7}).withMessage('NIK tidak boleh lebih dari 7 angka!')
    .custom(async (value, { req }) => {
        const duplikatNIK = await Karyawan.findOne({nik: value});
        if (value !== req.body.oldNIK && duplikatNIK) {
            throw new Error('NIK Karyawan sudah terdaftar!');
        }
        return true;
    }),
    body('nama')
    .matches(/^[A-Za-z\s]+$/).withMessage('Nama hanya boleh berisi huruf dan spasi')
    .custom(async (value, { req }) => {
        const duplikat = await Karyawan.findOne({nama: value});
        if (value !== req.body.oldNama && duplikat) {
            throw new Error('Nama Karyawan sudah terdaftar!');
        }
        return true;
    }),
    body('nama_jabatan').custom(async (value) => {
        const jabatanExists = await Jabatan.findById(value);
        if (!jabatanExists) {
            throw new Error('Jabatan tidak valid!');
        }
        return true;
    }),
    check('email', 'Email tidak valid!').isEmail()
        .custom(async (value, {req}) => {
            const duplikatEmail = await Dosen.findOne({ email: value });
            if (value !== req.body.oldEmail && duplikatEmail) {
                throw new Error('Email sudah digunakan!');
            }
            return true;
        }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const jabatanList = await Jabatan.find();
        res.render('edit-karyawan', {
            title: 'Form Ubah Data Karyawan',
            layout: 'layouts/main-layout',
            errors: errors.array(),
            karyawan: req.body,
            jabatanList,
        });
    } else {
        Karyawan.updateOne({_id: req.body._id}, 
            {
            $set: {
                nik: req.body.nik,
                nama: req.body.nama,
                nama_jabatan: req.body.nama_jabatan,
                email: req.body.email,
            },
        }).then(() => {
            req.flash('msg', 'Data Karyawan berhasil diubah!');
            res.redirect('/karyawan');
        });
    }
});
 

// Data Master
app.get('/matakuliah', async (req,res) => {

    const matakuliahs = await Matakuliah.find().sort({matkul : 1});

    res.render('matakuliah', {
        title : 'Halaman Daftar Matakuliah',
        layout: 'layouts/main-layout',
        matakuliahs,
        msg:req.flash('msg')
    })
}); 

// Menampilkan view Form add data
app.get('/matakuliah/add', (req, res) => {
    res.render('add-matakuliah', {
        title: 'Form Tambah Data Mata Kuliah',
        layout: 'layouts/main-layout',
    });
});

// //process add data contact
app.post('/matakuliah', [
    check('matkul', 'Mata Kuliah tidak valid!').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('add-matakuliah', {
            title: 'Form Tambah Data Mata Kuliah',
            layout: 'layouts/main-layout',
            errors: errors.array(),
        });
    } else {
        Matakuliah.create(req.body).then(() => {
            req.flash('msg', 'Data Mata Kuliah berhasil ditambahkan!');
            res.redirect('/matakuliah');
        }).catch(err => {
            console.error(err);
            res.status(500).send('Error adding mata kuliah');
        });
    }
});

//form process delete
app.delete('/matakuliah', (req, res) => {
    Matakuliah.deleteOne({matkul : req.body.matkul}).then((result) => {
     req.flash('msg', 'Data matakuliah berhasil dihapus!');
     res.redirect('/matakuliah'); 
    });
 });
 
//view Update
// form edit matkul
app.get('/matakuliah/edit/:matkul', async (req,res) => {
    const matakuliah = await Matakuliah.findOne({matkul : req.params.matkul});
 
     res.render('edit-matakuliah', {
      title: 'Form Ubah Data Matkuliah',
      layout: 'layouts/main-layout',
      matakuliah, 
     });
  });
 //process update data
 app.put('/matakuliah', [
    check('matkul','matkul tidak valid!'),
], (req,res) => {
    //tangkap dulu errors nya
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        // return res.status(400).json({errors: errors.array()});
        // jika error maka kembali ke halaman /matakuliah
        res.render('edit-matakuliah', {
            title: 'Form Ubah Data matakuliah',
            layout: 'layouts/main-layout',
            errors: errors.array(),
            matakuliah : req.body, // walaupun ada error, supaya tetap ada isi setiap coloumn (value)
        });
    } else {
        Matakuliah.updateOne({_id: req.body._id}, 
            {
                $set: {
                matkul: req.body.matkul,
            },
        }
        ).then((result) =>{
            req.flash('msg', 'Data matakuliah berhasil diubah!'); // maka menampilkan pesan alert
            res.redirect('/matakuliah'); // kirim ke halaman contact
        }); 
    }         
}
);

//view Detail 
app.get('/matakuliah/:matkul', async (req,res) => {
    const matakuliah = await Matakuliah.findOne({ // mencari berdasarkan matkul
        matkul: req.params.matkul
    })

    res.render('detail-matakuliah', {
        title : 'Halaman Detail Matakuliah',
        layout : 'layouts/main-layout',
        matakuliah,
    });
});

// Routes Jabatan
app.get('/jabatan', async (req, res) => {
    const jabatans = await Jabatan.find().sort({ nama_jabatan: 1 });  // Mengurutkan berdasarkan nama_jabatan
    res.render('jabatan', {
        title: 'Halaman jabatan',
        layout: 'layouts/main-layout',
        jabatans,
        msg: req.flash('msg')
    });
});

app.get('/jabatan/add', (req, res) => {
    res.render('add-jabatan', {
        title: 'Form Tambah Data Mata Kuliah',
        layout: 'layouts/main-layout',
    });
});

// //process add data jabatan
app.post('/jabatan', [
    check('nama_jabatan', 'Nama Jabatan tidak valid!').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('add-jabatan', {
            title: 'Form Tambah Data Jabatan',
            layout: 'layouts/main-layout',
            errors: errors.array(),
        });
    } else {
        Jabatan.create(req.body).then(() => {
            req.flash('msg', 'Data Mata Kuliah berhasil ditambahkan!');
            res.redirect('/jabatan');
        }).catch(err => {
            console.error(err);
            res.status(500).send('Error adding mata kuliah');
        });
    }
});
app.delete('/jabatan', (req,res) => {
    Jabatan.deleteOne({nama_jabatan: req.body.nama_jabatan}).then((result) =>{
        req.flash('msg', 'Data Jabatan Berhasil dihapus!');
        res.redirect('/jabatan');
    })
})


// view edit jabatan
app.get('/jabatan/edit/:nama_jabatan', async (req,res) =>{
    const jabatan = await Jabatan.findOne({nama_jabatan: req.params.nama_jabatan})
    
    res.render('edit-jabatan', {
        title: 'Halaman Edit Jabatan',
        layout : 'layouts/main-layout',
        jabatan,
    });
});
    
// process edit jabatan
 //process update data
 app.put('/jabatan', [
    check('nama_jabatan','Jabatan tidak valid!'),
], (req,res) => {
    //tangkap dulu errors nya
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        // return res.status(400).json({errors: errors.array()});
        // jika error maka kembali ke halaman /matakuliah
        res.render('edit-jabatan', {
            title: 'Form Ubah Data jabatan',
            layout: 'layouts/main-layout',
            errors: errors.array(),
            nama_jabatan : req.body, // walaupun ada error, supaya tetap ada isi setiap coloumn (value)
        });
    } else {
        Jabatan.updateOne({_id: req.body._id}, 
            {
                $set: {
                nama_jabatan: req.body.nama_jabatan,
            },
        }
        ).then((result) =>{
            req.flash('msg', 'Data Jabatan berhasil diubah!'); // maka menampilkan pesan alert
            res.redirect('/jabatan'); // kirim ke halaman contact
        }); 
    }         
}
);

// view detail
app.get('/jabatan/:nama_jabatan', async (req,res) => {
    const jabatan = await Jabatan.findOne({
        nama_jabatan: req.params.nama_jabatan})

    res.render('detail-jabatan', {
        title: 'Halaman Detail Jabatan',
        layout : 'layouts/main-layout',
        jabatan,
    });

});
app.listen(port, () => {
    console.log(`Database App | listening at http://localhost:${port}`);
});