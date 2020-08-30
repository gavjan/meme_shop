import * as fs from 'fs';
import {promisify} from 'util';
import * as sqlite3 from 'sqlite3';

function to_sql_date(date: Date): string {
    return date.toISOString().replace("T", " ").replace(/\.[0-9]{3}Z/g, "");
}
function make_db() {
    db.run('CREATE TABLE memes (' +
        'url VARCHAR(255),' +
        'price INT);'
    )
    db.run('CREATE TABLE meme_price_history (' +
        'url VARCHAR(255),' +
        'price INT,' +
        'username VARCHAR(36),' +
        'date DATETIME);'
    )
    db.run('CREATE TABLE sessions (' +
        'username VARCHAR(36),' +
        'pages_count INT,' +
        'expire_date DATETIME);'
    )
    db.close();
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
        let date = to_sql_date(new Date());
        db.run('INSERT INTO meme_price_history (url, price, username, date) VALUES ("' + x.name + '", ' + x.price + ', "admin", "' + date + '");');
        db.run('INSERT INTO memes (url, price) VALUES ("' + x.name + '", ' + x.price + ');');
    });
    db.close();
}
function load_home_page(req, res) {
    page_count_inc(req).then(pages_count_num => {
        let signed_in = (req.session.username !== undefined);
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
                csrfToken: req.csrfToken(),
                memes: top_memes,
                sign_in_css: signed_in ? "hidden": "",
                sign_out_css: signed_in ? "" : "hidden",
                pages_count: pages_count_num
            });
        });
    }).catch(err => console.error(err));
}
function load_meme_page(req, res, file_name) {
    page_count_inc(req).then(pages_count_num => {
        let signed_in = (req.session.username !== undefined);
        let sql = 'SELECT date, price FROM meme_price_history WHERE url = "' + file_name + '" ORDER BY date DESC;';
        db.all(sql, [], (err, rows) => {
            if(err) throw (err);
            let price_history = [];
            let curr_price = "Free";
            for(let {date, price} of rows) {
                price_history.push({date: date, price: price});
                if(curr_price === "Free")
                    curr_price = price;
            }

            res.render('meme', {
                title: "meme: " + file_name,
                url: file_name,
                curr_price: curr_price,
                price_history: price_history,
                change_price_css: signed_in ? "" : "hidden",
                csrfToken: req.csrfToken(),
                img_name: req.params.image,
                pages_count: pages_count_num
            });
        });
    }).catch(err => console.error(err));
}
function change_price(req, res, file_name, new_price) {
    let sql = 'SELECT price FROM memes WHERE url = "' + file_name + '";';
    db.all(sql, [], (err, rows) => {
        if(err) throw (err);
        let old_price: string;
        for(let {price} of rows)
            old_price = price;

        if(old_price != new_price) {
            let date = to_sql_date(new Date);
            db.run('INSERT INTO meme_price_history (url, price, username, date) VALUES ("' + file_name + '", ' + new_price + ', "' + req.session.username + '", "' + date + '");');
            db.run('UPDATE memes SET price = ' + new_price + ' WHERE url = "' + file_name + '";');
        }
        load_meme_page(req, res, file_name);
    });
}
function page_count_inc(req) {
    return new Promise((resolve, reject) => {
        const to_milliseconds = (h, m, s) => ((h*60*60+m*60+s)*1000);
        let signed_in = (req.session.username !== undefined);

        if(!signed_in) {
            if(req.session.pages_count == undefined) {
                req.session.pages_count = 1;
                req.session.expire = new Date(Date.now() + to_milliseconds(0,15,0));
            }
            else
                req.session.pages_count++;

            let curr_date = new Date(Date.now());
            let end_date = new Date(req.session.expire);
            if (curr_date > end_date) {
                req.session.pages_count = 1;
                req.session.expire = new Date(Date.now() + to_milliseconds(0,15,0));
            }
            resolve(req.session.pages_count);
        }
        else {
            let sql = 'SELECT pages_count, expire_date FROM sessions WHERE username = "' + req.session.username + '";';
            db.all(sql, [], (err, rows) => {
                if(err) reject(err);

                let pages_count_num: number;
                let date_str: string;
                for(let {pages_count, expire_date} of rows) {
                    pages_count_num = pages_count;
                    date_str = expire_date;
                }

                if(pages_count_num == 0) {
                    pages_count_num = 1;
                    date_str = (new Date(Date.now() + to_milliseconds(0,15,0))).toISOString();
                }
                else
                    pages_count_num++;

                db.run('UPDATE sessions SET pages_count = ' + pages_count_num + ', expire_date = "' + date_str + '" WHERE username = "' + req.session.username + '";');


                let curr_date = new Date(Date.now());
                let end_date = new Date(date_str);
                if (curr_date > end_date) {
                    pages_count_num = 1;
                    date_str = new Date(Date.now() + to_milliseconds(0,15,0)).toISOString();
                    db.run('UPDATE sessions SET pages_count = ' + pages_count_num + ', expire_date = "' + date_str + '" WHERE username = "' + req.session.username + '";');
                }
                resolve(pages_count_num);
            });
        }

    });


}

sqlite3.verbose();
let db = new sqlite3.Database('data.db');
let open = promisify(fs.open);
let express = require('express');
let server = express();
let cookieParser = require('cookie-parser');
let csrf = require('csurf');
let csrfProtection = csrf({cookie: true});
let body_parser = require('body-parser');
let session = require('express-session');

server.use(session({secret: "hurrdurr"}));
server.use(body_parser.urlencoded({
    extended: true
}));
server.use(cookieParser());
server.use(csrfProtection);
server.set('view engine', 'pug');

server.post('/views/assets/img/:image', function(req, res) {
    let file_name = './assets/img/' + req.params.image;
    if(!isNaN(req.body.change_price) && req.body.change_price !== "")
        change_price(req, res, file_name, req.body.change_price);
    else
        load_meme_page(req, res, file_name);

});
server.post('/sign_in', function(req, res) {
    let signed_in = (req.session.username !== undefined);
    if(!signed_in && req.body.username != "" && req.body.username != undefined) {
        let session_username = req.session.username = req.body.username;
        let sql = 'SELECT username FROM sessions WHERE username = "' + session_username + '";';
        db.all(sql, [], (err, rows) => {
            if(err) throw(err);

            let username_str:string = undefined;
            for(let {username} of rows)
                username_str = username;
            if(username_str == undefined)
                db.run('INSERT INTO sessions (username, pages_count) VALUES ("' + session_username + '", "0");\n');
        });


    }
    res.redirect('/');
});
server.post('/sign_out', function(req, res) {
    req.session.username = undefined;
    res.redirect('/');
});
server.get('/', function(req, res) {
    load_home_page(req, res);
});
server.get('/views/assets/img/:image', csrfProtection, function(req, res) {
    let file_name = './assets/img/' + req.params.image;

    load_meme_page(req, res, file_name);

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
