const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { 
    generateMsg,
    generateLocationMsg } = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')


const app = express()
//this can be done by express behind the scene
const server = http.createServer(app)
//now server supports socket.io (socket.io expects to be called by raw http server)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


let count = 0

//socket is an object that contains the information about the new connection
io.on('connection', (socket) => {

    /** example: count*/
    // console.log('New WebSocket connection')
    // //send an event and data (can be accessed in the callback)
    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++
    //     //send to the single connection
    //     //socket.emit('countUpdated', count)

    //     //send to all connections
    //     io.emit('countUpdated', count)
    // })

    /** listen to new user joining */
    socket.on('join', ({ username, room}, callback) => {

        //store the newly joined user
        const { error, user } = addUser({
            //sockect is shared among different events
            id: socket.id,
            username,
            room
        })

        if (error) {
            return callback(error)
        }

        //use user.room insted of room as addUser performs data cleaning
        socket.join(user.room)

        socket.emit('message', generateMsg('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMsg('Admin', `${user.username} has joined!`))
    
        //update the user list
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    /** listen to text messages */
    socket.on('sendMessage', (msg, callback) => {
        //instance of bad-word filter
        const filter = new Filter()
        if (filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }

        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMsg(user.username, msg))
        // send acknowledgement from server
        callback()
    })


    /** listen to location message */
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)

        const locationMsg = `http://google.com/maps?q=${location.latitude},${location.longitude} `
        io.to(user.room).emit('locationMessage', generateLocationMsg(user.username, locationMsg))
        callback()
    })


    /** listen to user leaving */
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMsg('Admin',`${user.username} has left.`))
            //update the user list
            io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
            })
        }

    })
})



server.listen(port, () => {
    console.log(`Server is up on port ${port}.`)
})
