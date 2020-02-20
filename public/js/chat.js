//connect to the WebSocket from client side
const socket = io()

//$ indicates that this variable is an element
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMsgTemplate = document.querySelector('#location-msg-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

/** example: count */
// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated', count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('clicked')
//     socket.emit('increment')
// })

/** autoscroll to the bottom if a new message comes in*/
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled (to the bottom)
    const scrollOffset = $messages.scrollTop + visibleHeight

    //if scrolled down to the bottom before the new message comes in
    if ( (containerHeight - newMessageHeight) <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

/** listen to the update of user list */
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html

})
/** listen to text messages */
socket.on('message', (msgObject) => {
    //render the template with the data
    const html = Mustache.render(messageTemplate, {
        username: msgObject.username,
        message: msgObject.text,
        createdAt: moment(msgObject.createdAt).format('M/D/Y h:mm a')
    })
    //Insert the template into the DOM
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()

})

/** listen to location messages */
socket.on('locationMessage', (locationObject) => {
    const html = Mustache.render(locationMsgTemplate, {
        username: locationObject.username,
        url: locationObject.url,
        createdAt:  moment(locationObject.createdAt).format('M/D/Y h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

/** send text messages */
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //disable the form while sending
    $messageFormButton.setAttribute('disabled', 'disabled')

    //e.target => the form
    const msgText = e.target.elements.message.value

    //the callback function is used for receiving acknowledgement from server
    socket.emit('sendMessage',msgText, (error) => {
        //enable the form if the server received the message
        $messageFormButton.removeAttribute('disabled', 'disabled')
        //clear the inputbox
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered')
    })
})

/** send location messages*/
$locationButton.addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    //async but not support promise and async/await syntax
    navigator.geolocation.getCurrentPosition((position) => {
        
        const location = {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude
        }

        socket.emit('sendLocation', location, () => {
            $locationButton.removeAttribute('disabled', 'disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        //redirect to the join page
        location.href = '/'
    }
})