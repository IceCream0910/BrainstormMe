const express = require('express'),
      http = require('http'),
      urlencoded = require('body-parser').urlencoded,
      socketIo = require('socket.io'),
      twilioRouter = require('./twilioRouter') ;


const app = express();

app.use(express.static(__dirname + '/static'));
app.use(urlencoded({ extended: false }));
app.use(twilioRouter);

const server = http.createServer(app)
const port = 3000;
console.log(`Twilio Client app HTTP server running at http://localhost:${port}`);
server.listen(port);


var io = socketIo.listen(server);
let { getElementHistory, insertDB, updateElDB, deleteLastElDB } = require( './canvasLib')

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
