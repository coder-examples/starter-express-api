const mysql = require('mysql2');

// create the connection to database
const connection = mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    database: process.env.db_name,
    port: +process.env.db_port,
    password: process.env.db_password
});

const getConnection = () => {
    return connection;
}

module.exports = getConnection;