const users = []

//add
const addUser = ({id, username, room}) => {
    // data cleaning
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate the data
    if (!username || !room){
        return {
            error: 'Username and room are required'
        }
    }

    // check for existing user
    const existingUser = users.find((user) => user.username === username && user.room === room)

    //validate username
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    // store user
    const user = { id, username, room}
    users.push(user)
    return { user }

}

//delete
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) {
        //remove 1 item at index from an array
        return users.splice(index, 1)[0]
    }
}

//get
const getUser = (id) => {
    const user = users.find( (user) => user.id === id)
    return user
}

//get users in room
const getUsersInRoom = (room) => {
    const usersInRoom = users.filter( (user) => user.room === room)
    return usersInRoom
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}