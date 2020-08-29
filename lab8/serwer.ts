import {createServer} from 'http';
import * as fs from 'fs';
import {promisify} from 'util';
import * as sqlite3 from "sqlite3";

function zalozBaze() {
    sqlite3.verbose();
    let db = new sqlite3.Database('baza.db');
    db.run('CREATE TABLE file_views (file_name VARCHAR(255), views INT);');
    db.close();
}

let server = createServer(
    (req, res) => {
        let {url} = req;
        let ans="";
        if(url==="/statystyki") {

            let db = new sqlite3.Database('baza.db');
            db.all('SELECT views, file_name FROM file_views;', [], (err, rows) => {
                let ans = "";
                if(err) {
                    ans = "Error getting stats";
                }
                else {
                    for (let {file_name, views} of rows)
                        ans += (file_name + ": " + views + " views\n");
                }
                db.close();
                res.write(ans);
                res.end();
            });
        }
        else {
            let file_name = url.substring(1);
            fs.readFile(file_name,"utf-8", (err, data) => {
                let ans = "";
                if(err) ans = "Requested file " + file_name + " doesn't exist";
                else {
                    ans = data.toString();
                    sqlite3.verbose();
                    let db = new sqlite3.Database('baza.db');
                    db.all('SELECT views FROM file_views WHERE file_name = "' + file_name + '";', [], (err, rows) => {
                        if (err) throw(err);
                        let view_count = 0;
                        if (rows.length > 0)
                            view_count = rows[0].views;
                        if (view_count === 0)
                            db.run('INSERT INTO file_views (file_name, views) VALUES ("' + file_name + '", 1);');
                        else
                            db.run('UPDATE file_views SET views = ' + (view_count + 1) + ' WHERE file_name = "' + file_name + '";');
                        db.close();

                    });

                }
                res.write(ans);
                res.end();
            })
        }
    }
);

server.listen(8080);
