import {createServer} from 'http';
import * as fs from 'fs';
import {promisify} from 'util';
import * as sqlite3 from 'sqlite3';
function load_home_page(res, top_memes) {

    res.render('index',{
        title: 'Meme Shop',
        message: "Meme of of the day",
        memes: top_memes
    });
}
function load_meme_page(res, file_name, price_history) {

    res.render('meme', {
        title: 'meme: ' + file_name,
        url: "../." + file_name,
        price_history: price_history
    });
}
let top_memes = [
    { url: './assets/img/1.jpg' },
    { url: './assets/img/2.jpg' },
    { url: './assets/img/3.jpg' }
]
let price_history = [
    { date: '2020-08-29 01:02:11', price: 300 },
    { date: '2020-08-29 01:02:14', price: 100 },
    { date: '2020-08-29 01:02:24', price: 200 }
]

let open = promisify(fs.open);
let write = promisify(fs.write);
let close = promisify(fs.close);
let express = require('express');
let server = express();

server.set('view engine', 'pug');
server.get('/', function(req, res) {
    load_home_page(res, top_memes);
});
server.get('/views/:image', function(req, res) {
    let file_name = './assets/img/' + req.params.image;
    console.log(file_name);
    load_meme_page(res, file_name, price_history);
});
server.get('/assets/img/:image', function(req, res) {
    let file_name = "./assets/img/" + req.params.image;
    open(file_name, "a").then(() => {
        fs.readFile(file_name, (err, data) => {
            if (err)
                res.write(err);
            else
                res.write(data);
            res.end();
        });
    }).then(() =>{}).catch(err => console.log('Error getting img', err));
});

server.listen(8080);
