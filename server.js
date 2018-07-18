const express = require('express'),
    http = require('http'),
    urlencoded = require('body-parser').urlencoded,
    socketIo = require('socket.io'),
    pg = require('pg-promise')(),
    twilioRouter = require('./twilioRouter') ;
    
require('dotenv').config();

const db = pg(process.env.DATABASE_URL);





const app = express();
app.use(express.static(__dirname + '/static'));
app.use(urlencoded({ extended: false }));
app.use(twilioRouter);
const server = http.createServer(app)

const port = process.env.PORT || 3000;
console.log(`Twilio Client app HTTP server running at http://localhost:${port}`);
server.listen(port);


var io = socketIo.listen(server);


////############## canvas ################
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

// event-handler for new incoming connections
io.on('connection', function (socket) {

    getElementHistory().then( (el_history) => {
        for (let objD of el_history) {
            if (objD !== '') {
                if (objD.type === 'polygon') {
                    socket.emit('draw_poly', objD)
                } else {
                    socket.emit('draw_line', objD);
                }
    
            }
        }
    })

    socket.on('start_line', (objD) => {
        insertDB(objD);
        socket.broadcast.emit('start_line', objD);
    })

    socket.on('real_time_line', (objD) => {
        updateElDB(objD);
        socket.broadcast.emit('real_time_line', objD);
        
    });

    socket.on('undo', (projectId) => {
        deleteLastElDB(projectId);
        io.emit('undo', (projectId));
    })

    socket.on('draw_poly', (objD) => {
        insertDB(objD);
        socket.broadcast.emit('draw_poly', objD);
        
    })
});
