const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'wow.grabweb.in',
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_name,
    port: 2307
});

app.get('/', (req, res) => {
    // if(req.headers['auth'] === `${Buffer.from(process.env.AUTH_USER + ':' + process.env.AUTH_PASS).toString('base64')}`) {
    let body;
    if (req.query?.id && req.query?.ip) {
        try {
            //region Update views
            try {
                connection.query(`SELECT * FROM ip WHERE id=${req.query.id} AND ip='${req.query.ip}'`, function (err, result) {
                    if (result?.length !== 1 || !result) {
                        connection.query(`INSERT INTO ip (id, ip) VALUES (${req.query.id}, '${req.query.ip}')`);
                        // Update views in basicinfo
                        connection.query(`UPDATE basicinfo SET views=views+1 WHERE id=${req.query.id}`);
                    }
                });
            } catch (e) {
            }
            //endregion Update views
            //region Return info
            connection.query(`SELECT * FROM basicinfo WHERE id=${req.query.id}`, function (err, result) {
                body = result;
                console.log({body, result, err});
            });
            connection.query(`SELECT * FROM photos WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                }
                body[0].photos = [];
                for (let i = 0; i < result.length; i++) {
                    body[0]['photos'].push(result[i]['photo_url']);
                }
            });
            connection.query(`SELECT * FROM about WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                } else {
                    body[0].about = [];
                    for (let i = 0; i < result.length; i++) {
                        body[0]['about'].push(result[i]['text']);
                    }
                }
            });
            connection.query(`SELECT * FROM videos WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                }
                body[0].videos = [];
                for (let i = 0; i < result.length; i++) {
                    body[0]['videos'].push(result[i]['video_url']);
                }
            });
            connection.query(`SELECT * FROM products WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                }
                body[0].products = [];
                for (let i = 0; i < result.length; i++) {
                    body[0]['products'].push({name: result[i]['name'], image: result[i]['image']});
                }
            });
            connection.query(`SELECT * FROM numbers WHERE main_id=${req.query.id}`, function (err, result) {
                if (!body) {
                    return;
                }
                body[0].numbers = [];
                for (let i = 0; i < result.length; i++) {
                    body[0]['numbers'].push(result[i]['phone']);
                }
                try {
                    res.send(body[0]);
                } catch (e) {
                }
            });
            //endregion Return info
        } catch (e) {
        }
    }
})

app.post('/insert', (req, res) => {
    const { products, company_name, logo, holder_name, holder_post, email, map, facebook, instagram, twitter, youtube, nature, product_or_service, address, website, photos, videos, about, numbers, expire } = req.body;

    const basicInfo = {
        logo,
        company_name,
        holder_name,
        holder_post,
        email,
        map,
        facebook,
        instagram,
        twitter,
        youtube,
        nature,
        product_or_service,
        address,
        website,
        expire,
        full_logo: null // since full_logo is not in the request payload, I'm setting it to null here
    };

    connection.query('INSERT INTO basicinfo SET ?', basicInfo, (error, results, fields) => {
        const authHeader = req.headers.auth;
        const expectedAuth = `${process.env.AUTH_ADMIN}:${process.env.AUTH_ADMIN_PASS}`;

        if (authHeader !== expectedAuth) {
            res.status(401).json({ error: 'auth' });
            return;
        }

        if (error) throw error;

        const mainId = results.insertId; // get the ID of the inserted row in the basicinfo table

        // insert data into the about table
        // Handle 'about' data
        if (about && about.length > 0) {
            const aboutData = about.map(text => ({ main_id: mainId, text }));
            connection.query('INSERT INTO about (main_id, text) VALUES ?', [aboutData.map(obj => Object.values(obj))], (error, results, fields) => {
                if (error) throw error;
            });
        }


        if(numbers && numbers.length>0) {
            // insert data into the numbers table
            const numbersData = numbers.map((phone) => {
                return { main_id: mainId, phone };
            });
            connection.query('INSERT INTO numbers (main_id, phone) VALUES ?', [numbersData.map((obj) => Object.values(obj))], (error, results, fields) => {
                if (error) throw error;
            });
        }

        if(photos && photos.length>0) {
            // insert data into the photos table
            const photosData = photos.map((photo_url) => {
                return { main_id: mainId, photo_url };
            });
            connection.query('INSERT INTO photos (main_id, photo_url) VALUES ?', [photosData.map((obj) => Object.values(obj))], (error, results, fields) => {
                if (error) throw error;
            });
        }

        if (products && products.length>0) {
            // insert data into the products table
            const productsData = products.map((product) => {
                return { main_id: mainId, name: product.name, image: product.image };
            });
            connection.query('INSERT INTO products (main_id, name, image) VALUES ?', [productsData.map((obj) => Object.values(obj))], (error, results, fields) => {
                if (error) throw error;
            });
        }

        if(videos && videos.length>0) {
            // insert data into the video table
            const videosData = videos.map((video_url) => {
                return { main_id: mainId, video_url };
            });
            connection.query('INSERT INTO video (main_id, video_url) VALUES ?', [videosData.map((obj) => Object.values(obj))], (error, results, fields) => {
                if (error) throw error;
            });
        }

        res.status(200).json({ message: 'Data inserted successfully.' });
    });
});

app.listen(process.env.PORT || 4200, () => {
    console.log('Server started on port ' + process.env.PORT);
});
