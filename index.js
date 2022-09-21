const express = require('express');
// require('dotenv').config()
const getConnection = require('./connect');
const cors = require("cors");
const con = getConnection();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    if(req.headers['auth'] === `${btoa(process.env.AUTH_USER + ':' + process.env.AUTH_PASS)}`) {
        try {
            let body;
            if(req.query.id === undefined || req.query.ip === undefined) {
                return res.json({error:true})
            }
            //region Update views
            try {
                con.query(`SELECT * FROM ip WHERE id=${req.query.id} AND ip='${req.query.ip}'`, function (err, result) {
                    if (result?.length !== 1 || !result) {
                        con.query(`INSERT INTO ip (id, ip) VALUES (${req.query.id}, '${req.query.ip}')`);
                        // Update views in basicinfo
                        con.query(`UPDATE basicinfo SET views=views+1 WHERE id=${req.query.id}`);
                    }
                });
            } catch (e) {}
            //endregion Update views
            //region Return info
            con.query(`SELECT * FROM basicinfo WHERE id=${req.query.id}`, function (err, result) {
                body = result;
                if (!result) {
                    return res.json({ error: true })
                } else {
                    body[0]['expired'] = false;
                }
            });
            con.query(`SELECT * FROM photos WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                }
                body[0].photos = [];
                for (let i = 0; i < result.length; i++) {
                    body[0]['photos'].push(result[i]['photo_url']);
                }
            });
            con.query(`SELECT * FROM about WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                } else {
                    body[0].about = [];
                    for (let i = 0; i < result.length; i++) {
                        body[0]['about'].push(result[i]['text']);
                    }
                }
            });
            con.query(`SELECT * FROM videos WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                }
                body[0].videos = [];
                for (let i = 0; i < result.length; i++) {
                    body[0]['videos'].push(result[i]['video_url']);
                }
            });
            con.query(`SELECT * FROM products WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                }
                body[0].products = [];
                for (let i = 0; i < result.length; i++) {
                    body[0]['products'].push({name: result[i]['name'], image: result[i]['image']});
                }
            });
            con.query(`SELECT * FROM numbers WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                }
                body[0].numbers = [];
                for (let i = 0; i < result.length; i++) {
                    body[0]['numbers'].push(result[i]['phone']);
                }
                try {
                    res.send(body[0]);
                } catch (e) {}
            });
            //endregion Return info
        } catch (e) {}
    } else {
        res.status(401).json({ error: 'authorization' })
    }
})

app.post('/insert', (req, res) => {
    let error = false;
    let main_id = 1;
    if(req.headers['auth'] === `${btoa(process.env.AUTH_ADMIN + ':' + process.env.AUTH_ADMIN_PASS)}`) {
        try {
            const { expire, logo = '', company_name = 'NULL', holder_name = 'NULL', holder_post = 'NULL', email = 'NULL', map = 'NULL', facebook = 'NULL', instagram = 'NULL', twitter = 'NULL', youtube = 'NULL', nature = 'NULL', product_or_service = 1, address = 'NULL', website = 'NULL' } = req.body;
            console.log(req.body['expire']);
            const {photos = [], videos = [], numbers = [], about = [], products = []} = req.body;
            con.query(`INSERT INTO basicinfo 
                            (logo, company_name, holder_name, holder_post, email, map, facebook, instagram, twitter, youtube, nature, product_or_service, address, views, website, expire) 
                            VALUES  ("${logo}", "${company_name}", "${holder_name}", "${holder_post}", "${email}", "${map}", "${facebook}", "${instagram}", "${twitter}", "${youtube}", "${nature}", "${product_or_service}", "${address}", 0, "${website}", "${expire};")` , (err, result) => {
                if(err) {
                    error = 'basicinfo: ' + `INSERT INTO basicinfo 
                            (logo, company_name, holder_name, holder_post, email, map, facebook, instagram, twitter, youtube, nature, product_or_service, address, views, website, expire) 
                            VALUES  ("${logo}", "${company_name}", "${holder_name}", "${holder_post}", "${email}", "${map}", "${facebook}", "${instagram}", "${twitter}", "${youtube}", "${nature}", "${product_or_service}", "${address}", 0, "${website}", "${expire};")`;
                } else {
                    main_id = result.insertId;
                }
            })
            setTimeout(() => {
                if(JSON.stringify(photos) != JSON.stringify([])) {
                    let str = "";
                    for (let i = 0; i < photos.length; i++) {
                        str += `("${photos[i]}", ${main_id}),`;
                    }
                    const query = `INSERT INTO photos (photo_url, main_id) VALUES ${str.slice(0,-1)};`;
                    con.query(query, (err) => {
                        if(err) {
                            error = true;
                        }
                    })
                }
                if(JSON.stringify(numbers) != JSON.stringify([])) {
                    let str = "";
                    for (let i = 0; i < numbers.length; i++) {
                        str += `("${numbers[i]}", ${main_id}),`;
                    }
                    const query = `INSERT INTO numbers (number, main_id) VALUES ${str.slice(0,-1)};`;
                    con.query(query, (err) => {
                        if(err) {
                            error = true;
                        }
                    })
                }
                if(JSON.stringify(videos) != JSON.stringify([])) {
                    let str = "";
                    for (let i = 0; i < videos.length; i++) {
                        str += `("${videos[i]}", ${main_id}),`;
                    }
                    const query = `INSERT INTO videos (video_url, main_id) VALUES ${str.slice(0,-1)};`;
                    con.query(query, (err) => {
                        if(err) {
                            error = true;
                        }
                    })
                }
                if(JSON.stringify(about) !== JSON.stringify([])) {
                    let str = "";
                    for (let i = 0; i < about.length; i++) {
                        str += `("${about[i]}", ${main_id}),`;
                    }
                    const query = `INSERT INTO about (text, main_id) VALUES ${str.slice(0,-1)};`;
                    con.query(query, (err) => {
                        if(err) {
                            error = true;
                        }
                    })
                }
                if(JSON.stringify(products) != JSON.stringify([])) {
                    let str = "";
                    for (let i = 0; i < products.length; i++) {
                        str += `("${products[i]['name']}", "${products[i]['image']}", ${main_id}),`;
                    }
                    const query = `INSERT INTO products (name, image, main_id) VALUES ${str.slice(0,-1)};`;
                    con.query(query, (err) => {
                        if(err) {
                            error = true;
                        }
                    })
                }
                if(error) {
                    return res.status(404).json({error: error});
                } else {
                    return res.status(200).json({error:false,id:main_id});
                }
            }, 2000)
        } catch (e) {res.send('Some Random error:\n' + e)}
    } else {
        res.status(401).json({ error: 'authorization' })
    }
})
app.listen(process.env.PORT || 4200, () => {
})