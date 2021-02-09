const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const { generateMessage, generateLocationMessage } = require('./utils/messages');

// Create the server
const app = express();
const server = http.createServer(app);
const io = socketio(server)

// Set the port for the server
const port = process.env.PORT || 3000;
// creat the path to what the server will serve up
const publicDirectoryPath = path.join(__dirname, '../public');
// tell the server to serve up the path
app.use(express.static(publicDirectoryPath));

// start the server and listen on the port
server.listen(port, () => {
    console.log(`server is up on port ${port}!`);
});



io.on('connection', (socket) => {

    // join specific room
    socket.on('join', ({ username, room}) => {
        
        // join specific room
        socket.join(room);

        // emit the welcome message 
        socket.emit('message', generateMessage('Welcome!'));

        // emit message to everyone but this current socket
        socket.broadcast.to(room).emit('message', generateMessage(`${username} has joined!`));

    });

    // create event listener to listen to the client that just connected
    socket.on('messageSubmit', (message, callback) => {
        // init bad words
        const filter = new Filter();
        if(filter.isProfane(message)){
            return callback('profanity is not allowed');
        }
        
        // emit to everyone
        io.to('').emit('message', generateMessage(message));
        // send acknowledgement back to client
        callback();
    });

    socket.on('sendLocation', (coords, callback) => {
        io.emit('locationMessage', generateLocationMessage(`https//www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback('Location shared!');
    })

    // send message when client is disconnected
    socket.on('disconnect', () => {
        io.emit('message', generateMessage('a user has left'))
    })


});


