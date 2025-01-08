const express = require('express');
const path = require('path');
const app = express()
const server = require('http').createServer(app);
const { format } = require("date-fns");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const io = require('socket.io')(server);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function (socket) {

    socket.on('createRoom', function ({ username, roomCode }) {
        socket.username = username;
        socket.roomCode = roomCode;

        socket.join(roomCode);
        socket.emit('update', `You created the room ! code: ${roomCode}`);
    });

    socket.on('newuser', function ({ username, chatCode }) {
        socket.username = username;
        socket.roomCode = chatCode;

        socket.join(chatCode);
        socket.emit('update', `Welcome to the room`);
        socket.broadcast.to(chatCode).emit('update', `${username} joined the room`);

        // socket.broadcast.to(chatCode).emit('update', `${username} joined Today, ${format(new Date(), "h:mm a")}`);
    });

    socket.on('chat', function (message) {
        socket.broadcast.to(socket.roomCode).emit('chat', message);
    });

    socket.on('file', (message) => {
        socket.broadcast.to(socket.roomCode).emit('file', message);
    });

    socket.on('typing', function () {
        socket.broadcast.to(socket.roomCode).emit('typing', socket.username);
    });

    socket.on('exituser', function () {
        if (socket.username) {
            socket.broadcast.to(socket.roomCode).emit('update', socket.username + ` left Today, ${format(new Date(), "h:mm a")}`);
        }
    });

    socket.on('stopTyping', function () {
        socket.broadcast.to(socket.roomCode).emit('stopTyping', socket.username);
    });

    socket.on('disconnect', function () {
        if (socket.username) {
            socket.username = null;
        }
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ fileUrl });
    } else {
        res.status(400).send('No file uploaded');
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

server.listen(5000, () => console.log('Server is running on port 5000'));
