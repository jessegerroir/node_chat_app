const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const config = require('./../config/config');

const { generateMessage, generateLocationMessage } = require('./utils/messages');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

// Create the server
const app = express();
const server = http.createServer(app);
const io = socketio(server)

// Set the port for the server
const port = config.port;
// creat the path to what the server will serve up
const publicDirectoryPath = path.join(__dirname, '../public');
// tell the server to serve up the path
app.use(express.static(publicDirectoryPath));

// start the server and listen on the port
server.listen(port, () => {
    console.log(`server is up on port ${port}!`);
});


// On connection 
// create following event listeners
io.on('connection', (socket) => {

    // - listen for a user wanting to join a specific room
    socket.on('join', ({username, room}, callback) => {
        
        // First add user to master list
        const { error, user} = addUser({id: socket.id, username, room});

        // If we encountered an error
        // (username in use, room doesn't exist)
        if (error) {
            // return the error
            return callback(error);
        }

        // join specific room
        socket.join(user.room);

        // emit the welcome message 
        socket.emit('message', generateMessage('System','Welcome!'));

        // emit message to everyone but this current socket
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`));

        // Send all users in room to client
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // return to where this was called from
        callback();
    });

    // - listen for a message being submitted
    socket.on('messageSubmit', (message, callback) => {
        
        // get the user from the list using connection id
        const user = getUser(socket.id);
        
        // init bad words
        const filter = new Filter();
        if(filter.isProfane(message)){
            return callback('profanity is not allowed');
        }
        
        // emit to everyone in room
        io.to(user.room).emit('message', generateMessage(user.username, message));

        // send acknowledgement back to client
        callback();
    });

    // - listen for a location being submitted
    socket.on('sendLocation', (coords, callback) => {
        
        // get the user from the list using connection id
        const user = getUser(socket.id);
        
        // emit location to user's room
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https//www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        
        // call callback
        callback('Location shared!');
    })

    // - listen for a user disconnect 
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        // disconect user if they existed
        if (user) {
            io.to(user.room).emit('message', generateMessage('System',`${user.username} has left`));
            
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })


});


