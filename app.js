const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

app.use(express.static(path.join(__dirname, 'Public')));


app.get('/', (req, res) => {
    res.render('UniBite');
});

app.get('/Login', (req, res) => {
    res.render('Auth/Login');
});

app.get('/SignUp', (req, res) => {
    res.render('Auth/SignUp');
});

app.get('/Product-details', (req, res) => {
    res.render('Products/Product-details');
});

app.get('/Products', (req, res) => {
    res.render('Products/Products');
});

app.get('/About-us', (req, res) => {
    res.render('About-us');
});

app.get('/Admin', (req, res) => {
    res.render('Admin');
});

app.get('/Help', (req, res) => {
    res.render('Help');
});


app.get('/Stores', (req, res) => {
    res.render('Stores');
});



const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
