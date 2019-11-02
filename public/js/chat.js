const socket = io()
const form = document.querySelector('form')
const button = document.getElementById('button')
const input = form['input']
const sendLocationButton = document.getElementById('send-location')
const renderMessage = document.getElementById('render')
const template = document.getElementById('templateMessage').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML
const sidebarMessage = document.querySelector('.chat__sidebar')
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

form.addEventListener('submit', (e) => {
    e.preventDefault()
    const message = input.value
    button.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage', message, (error) => {
        if (error) return console.log('Profanity is not allowed')
        console.log('Message delivered')
        input.value = ""
        input.focus()
        button.removeAttribute('disabled')
    })
})

socket.on('locationMessage', (message) => {
    const mustache = Mustache.render(locationTemplate, {
        username: message.username,
        message: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    renderMessage.insertAdjacentHTML('beforeend', mustache)
})

socket.on('roomData', ({ users, room }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    sidebarMessage.innerHTML = html
})

socket.on('message', (message) => {
    console.log(message)
    const mustache = Mustache.render(template, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    renderMessage.insertAdjacentHTML('beforeend', mustache)
})

sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Not support')
    sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared')
            sendLocationButton.removeAttribute('disabled')
        })
    })
   
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})