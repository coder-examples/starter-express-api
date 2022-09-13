const express = require('express');
// require('dotenv').config();
const getConnection = require('./connect');
const cors = require("cors");
const basicAuth = require('express-basic-auth');
const con = getConnection();

const app = express();
app.use(basicAuth({
    users: {
        'admin': 'msogr8ful&A@yush@1',
    }
}))

app.use(cors());

app.options('*', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.end();
});

app.get('/', (req, res) => {
    let body;
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
        if(result[0].expire < Date.now()) {
           return res.send({ expired: true });
        } else {
            body[0]['expired'] = false;
        }
    });
    con.query(`SELECT * FROM photos WHERE main_id=${req.query.id}`, function (err, result) {
        body[0].photos = [];
        for (let i = 0; i < result.length; i++) {
            body[0]['photos'].push(result[i]['photo_url']);
        }
    });
    con.query(`SELECT * FROM about WHERE main_id=${req.query.id}`, function (err, result) {
        body[0].about = [];
        for (let i = 0; i < result.length; i++) {
            body[0]['about'].push(result[i]['text']);
        }
    });
    con.query(`SELECT * FROM videos WHERE main_id=${req.query.id}`, function (err, result) {
        body[0].videos = [];
        for (let i = 0; i < result.length; i++) {
            body[0]['videos'].push(result[i]['video_url']);
        }
    });
    con.query(`SELECT * FROM products WHERE main_id=${req.query.id}`, function (err, result) {
        body[0].products = [];
        for (let i = 0; i < result.length; i++) {
            body[0]['products'].push({name: result[i]['name'], image: result[i]['image']});
        }
    });
    con.query(`SELECT * FROM numbers WHERE main_id=${req.query.id}`, function (err, result) {
        body[0].numbers = [];
        for (let i = 0; i < result.length; i++) {
            body[0]['numbers'].push(result[i]['phone']);
        }
        try {
            res.send(body[0]);
        } catch (e) {}
    });
    //endregion Return info
})
app.all('/test', (req, res) => {
    con.query(`SELECT * FROM basicinfo WHERE id=10`, function (err, result) {
        res.send(result);
    });
})
app.listen(process.env.PORT || 3000)