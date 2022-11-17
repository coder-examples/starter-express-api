const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'wow.grabweb.in',
    user: process.env.db_user,
    database: process.env.db_name,
    port: 2307,
    password: process.env.db_password
});

const getConnection = () => {
    return connection;
}

module.exports = getConnection;