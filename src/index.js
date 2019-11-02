const express = require('express')
const http = require('http')
const port = process.env.PORT || 3000
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')
const server = http.createServer(app)
const path = require('path')
const dir = path.join(__dirname, '../public')
const io = socketio(server)
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { getUser, getUsersInRoom, addUser, removeUser  } = require('./utils/users')

app.use(express.static(dir))

app.get('/', (req, res) => {
    res.render('index')
})

io.on('connection', (socket) => {
    console.log('New connection')
    
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) return callback('Message is not delivered')
        io.to(user.room).emit('message', generateMessage(message, user.username))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id) 
        if (user) io.to(user.room).emit('message', generateMessage('[System] ',user.username+' has left the chat'))
    })
    socket.on('sendLocation', ({ latitude, longitude}, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback()
    })
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id:socket.id , ...options })
        if(error) return callback(error)
        socket.join(user.room)
        socket.emit('message', generateMessage('[System] ',`Welcome to room ${user.room}`))
        socket.broadcast.to(user.room).emit('message', generateMessage('[System] ',`${user.username} has joined! `))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
})

server.listen(port, () => {
    console.log('Listening on port', port)
})