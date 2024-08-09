const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',  
    user: 'root',       
    password: '',       
    database: 'yamix' 
});


module.exports = db;