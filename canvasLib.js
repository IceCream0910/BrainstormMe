require('dotenv').config();
const pg = require('pg-promise')(),
      db = pg(process.env.DATABASE_URL);

      
let getElementHistory = () => {
    return db.query(`SELECT * FROM el_history ORDER BY projectid, el_count;`)
        .then((elements) => {
            el_history = [];
            elements.forEach((element) => {
                element.d = JSON.parse(element.d);
                el_history.push(element);
            })
            return el_history;
        })
}

let insertDB = (objD) => {
    return db.query(`
            INSERT INTO el_history VALUES (
            1, ${objD.el_count}, '${objD.type}', '${JSON.stringify(objD.d)}', '${objD.color}', '${objD.size}');`);
}
    
let updateElDB = (objD) => {
    return db.query(`
            UPDATE el_history SET
                d = '${JSON.stringify(objD.d)}'
                WHERE projectid = ${objD.projectid} AND
                el_count = ${objD.el_count};`);
}

let deleteLastElDB = (projectId) => {
    return db.query(`
        SELECT max(el_count) FROM el_history
        WHERE projectid = ${projectId};`)
            .then( result => result[0].max)
            .then( (lastCount) => {
                db.query(`DELETE FROM el_history
                WHERE projectid = ${projectId} 
                AND el_count = ${lastCount};`)
            })
}

module.exports = {
    getElementHistory,
    insertDB,
    updateElDB,
    deleteLastElDB,
}

