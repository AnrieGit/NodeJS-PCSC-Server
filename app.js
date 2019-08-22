const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { NFC } = require('nfc-pcsc');

const port = process.env.PORT || 4001;
const index = require('./routes/index');

const app = express();
app.use(index);

const server = http.createServer(app);
const io = socketIO(server);

const getApiAndEmit = async (socket, card) => {
    socket.emit('FromServer', card);
};

io.on('connection', socket => {
    console.log('New Client connected');

    const nfc = new NFC(); // optionally you can pass logger

    let r; // for reader 😁

    nfc.once('reader', reader => {
        console.log(`${reader.reader.name}  device attached`);
        reader.on('card', card => {
            console.log(`${reader.reader.name}  card detected`, card);
            getApiAndEmit(socket, card);
        });

        reader.on('card.off', card => {
            console.log(`${reader.reader.name}  card removed`, card);
            getApiAndEmit(socket, (card = null));
        });

        reader.on('error', err => {
            console.log(`${reader.reader.name}  an error occurred`, err);
        });

        reader.on('end', () => {
            console.log(`${reader.reader.name}  device removed`);
        });

        r = reader; // Make reader able to access 👍
    });

    nfc.on('error', err => {
        console.log('an error occurred', err);
    });

    socket.on('disconnect', () => {
        r.close(); // Disconnect the reader to make a new session ✌
        console.log('Client disconnected');
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
