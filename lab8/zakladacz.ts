import * as sqlite3 from 'sqlite3';

function zalozBaze() {
    sqlite3.verbose();
    let db = new sqlite3.Database('baza.db');
    db.run('CREATE TABLE wyswietlenia (sciezka VARCHAR(255), liczba INT);');
    db.close();
}
function wpiszDane() {
    sqlite3.verbose();
    let db = new sqlite3.Database('baza.db');
    db.run('INSERT INTO wyswietlenia (sciezka, liczba) VALUES ("a", 1), ("b",2);');
    db.close();
}
sqlite3.verbose();
let db = new sqlite3.Database('baza.db');

db.all('SELECT sciezka, liczba FROM wyswietlenia;', [], (err, rows) => {
    if (err) throw(err);

    for(let {sciezka, liczba} of rows) {
        console.log(sciezka, '->', liczba);
    }
    db.close();
});



//zalozBaze();

//wpiszDane();

const most_expensive = [
    {
        "id": 10,
        "name": "Gold",
        "price": 1000,
        "url": "https://i.redd.it/h7rplf9jt8y21.png"
    },
    {
        "id": 9,
        "name": "Platinum",
        "price": 1100,
        "url": "http://www.quickmeme.com/img/90/90d3d6f6d527a64001b79f4e13bc61912842d4a5876d17c1f011ee519d69b469.jpg"
    },
    {
        "id": 8,
        "name": "Elite",
        "price": 1200,
        "url": "https://i.imgflip.com/30zz5g.jpg"}
]