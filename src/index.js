const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');
const app = express();

// Refactors code so that socket.io and express work together properly
const server = http.createServer(app);

// Call socketio function to configure socket.io to work with a given server
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

// server (emit) --> client (receive) - countUpdated
// client (emit) --> server (receive) - increment
// Listening for a connection event to occur
io.on('connection', (socket) => {
    // socket is an object that contains information about the new connection
    console.log('New WebSocket connection!');

    socket.on('join', (options, callback) => {
        // socket.id is the unique identifier for that connection
        const { error, user } = addUser({ id: socket.id, ...options }); // Options is a spread operator that returns username and room

        if (error) {
            return callback(error);
        }

        // Join a specfic chatroom and pass to it the name we want to join
        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        });
        // Let the client know that they are able to join
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback('Delivered'); // Call callback to acknowledge the event
    });

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit(
            'locationMessage',
            generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
        );
        callback();
    });

    // param disconnect is a built-in event
    // Sends message when a user disconnects
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });
});

// Changed from 'app' to 'server'
server.listen(port, () => {
    console.log('Server is up on port ' + port);
});
