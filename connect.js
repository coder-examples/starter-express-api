const mysql = require('mysql2');

// create the connection to database
const connection = mysql.createConnection({
    host: 'wow.grabweb.in',
    user: 'intelicard_admin',
    database: 'intelicard',
    port: 2307,
    password: 'ICard@123'
});

const getConnection = () => {
    return connection;
}

module.exports = getConnection;