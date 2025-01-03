const express = require('express');
const path = require('path');
const app = express()
const server = require('http').createServer(app);
const { format } = require("date-fns");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function (socket) {
    socket.on('newuser', function (username) {
        socket.username = username;
        socket.broadcast.emit('update', username + ` joined Today, ${format(new Date(), "h:mm a")}`);
    });

    socket.on('exituser', function () {
        if (socket.username) {
            socket.broadcast.emit('update', socket.username + ` left Today, ${format(new Date(), "h:mm a")}`);
        }
    });

    socket.on('chat', function (message) {
        socket.broadcast.emit('chat', message);
    });

    socket.on('file', (message) => {
        socket.broadcast.emit('file', message);
    });

    socket.on('typing', function () {
        if (socket.username) {
            socket.broadcast.emit('typing', socket.username);
        }
    });

    socket.on('stopTyping', function () {
        if (socket.username) {
            socket.broadcast.emit('stopTyping', socket.username);
        }
    });
    socket.on('disconnect', function () {
        if (socket.username) {
            socket.username = null;
        }
    });
    socket.on('edit-message', (data) => {
        socket.broadcast.emit('edit-message', data);
    });

    socket.on('delete-message', (data) => {
        socket.broadcast.emit('delete-message', data);
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