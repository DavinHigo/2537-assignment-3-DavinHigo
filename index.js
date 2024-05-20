const express = require('express');
const fs = require("fs");
require('dotenv').config();


const app = express();
app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.render('index');
}); 

        // Handle 404 Not Found
        app.get('*', (req, res) => {
            res.status(404).render('404');
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });