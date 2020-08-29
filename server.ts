import {createServer} from 'http';
import * as fs from 'fs';
import {promisify} from 'util';
import * as sqlite3 from 'sqlite3';

function curr_sql_date(): string {
    return new Date().toISOString().replace("T", " ").replace(/\.[0-9]{3}Z/g, "");
}

function make_db() {
    db.run('CREATE TABLE memes (' +
        'url VARCHAR(255),' +
        'price INT);'
    )
    db.run('CREATE TABLE meme_price_history (' +
        'url VARCHAR(255),' +
        'price INT,' +
        'date DATETIME);'
    )
    db.close;
}

function add_memes() {
    let memes = [
        {
            name: "./assets/img/1.jpg",
            price: 200
        }, {
            name: "./assets/img/2.jpg",
            price: 100

        }, {
            name: "./assets/img/3.jpg",
            price: 300

        }, {
            name: "./assets/img/4.jpg",
            price: 400

        }, {
            name: "./assets/img/5.jpg",
            price: 500
        }, {
            name: "./assets/img/6.jpg",
            price: 600
        }
    ]
    memes.forEach(x => {
        let date = curr_sql_date();
        db.run('INSERT INTO meme_price_history (url, price, date) VALUES ("' + x.name + '", ' + x.price + ', "' + date + '");');
        db.run('INSERT INTO memes (url, price) VALUES ("' + x.name + '", ' + x.price + ');');
    });
}

function load_home_page(res) {
    let sql = 'SELECT url, price FROM memes ORDER BY price DESC;';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        let top_memes = [];
        let i = 0;
        for(let {url, price} of rows) {
            top_memes.push({url: url, price: price});
            i++;
            if(i >= 3)
                break;
        }
        res.render('index', {
            title: "Meme Shop",
            message: "Meme of of the day",
            memes: top_memes
        });
    });


}

function load_meme_page(res, file_name) {
    let sql = 'SELECT date, price FROM meme_price_history WHERE url = "' + file_name + '" ORDER BY date DESC;';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        let price_history = [];
        let curr_price = "Free";
        for(let {date, price} of rows) {
            price_history.push({date: date, price: price});
            if(curr_price==="Free")
                curr_price = price;
        }

        res.render('meme', {
            title: "meme: " + file_name,
            url: "../../." + file_name,
            curr_price: curr_price,
            price_history: price_history
        });
    });
}

function change_price(res, file_name, new_price) {
    let sql = 'SELECT price FROM memes WHERE url = "' + file_name +'";';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        let old_price: string;
        for(let {price} of rows)
            old_price = price;

        if(old_price != new_price) {
            let date = curr_sql_date();
            db.run('INSERT INTO meme_price_history (url, price, date) VALUES ("' + file_name + '", ' + new_price + ', "' + date + '");');
            db.run('UPDATE memes SET price = ' + new_price + ' WHERE url = "' + file_name + '";');
        }
        load_meme_page(res,file_name);
    });
}

sqlite3.verbose();
let db = new sqlite3.Database('data.db');
let open = promisify(fs.open);
let write = promisify(fs.write);
let close = promisify(fs.close);
let express = require('express');
let server = express();
server.set('view engine', 'pug');
server.get('/', function(req, res) {
    load_home_page(res);
});
server.get('/views/assets/img/:image', function(req, res) {
    let file_name = './assets/img/' + req.params.image;

    let url: string = req.url;
    let regex = /\?change_price=\d+&change_price_button=Change\+Price\b/;
    if(regex.test(url)) {
        let new_price_url = regex.exec(url);
        let new_price = /\d+/.exec(new_price_url[0]);
        change_price(res, file_name, new_price[0]);
    }
    else {
        load_meme_page(res, file_name);
    }
});
server.get('/assets/img/:image', function(req, res) {
    let file_name = "./assets/img/" + req.params.image;
    open(file_name, "a").then(() => {
        fs.readFile(file_name, (err, data) => {
            if(err)
                res.write(err);
            else
                res.write(data);
            res.end();
        });
    }).then(() => {
    }).catch(err => console.log('Error getting img', err));
});

//make_db();
//add_memes();

server.listen(8080);
