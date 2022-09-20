const express = require('express');
const getConnection = require('./connect');
const cors = require("cors");
const basicAuth = require('express-basic-auth');
const con = getConnection();

const app = express();
app.use(cors());

app.get('/', (req, res) => {
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
})
app.all('/test', (req, res) => {
    con.query(`SELECT * FROM basicinfo WHERE id=10`, function (err, result) {
        res.send(result);
    });
})
app.listen(process.env.PORT || 3000)