const socket = io();

// server (emit) -> client (receive) -- acknowledgement --> server
// client (emit) -> server (receive) -- acknowledgement --> client

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');

const $locationButton = document.querySelector('#send-location');

const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const messageLocationTemplate = document.querySelector('#message-template-location').innerHTML;

socket.on('message', (message) => {
    // complie template with data we want to render inside of it
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    // Insert populated template into correct section
    $messages.insertAdjacentHTML('beforeend', html);

});

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage);
    const html = Mustache.render(messageLocationTemplate, {
        locationMessage,
    })
    // insert rendered html into page
    $messages.insertAdjacentHTML('beforeend', html);
});

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // disable form
    $messageFormButton.setAttribute('disabled', 'disabled');

    const text = document.getElementById('textField').value;
    socket.emit('messageSubmit', text, (error) => {
        
        // enable form
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            console.log(error);
        } else {
            console.log('Message delivered');
        }
        
    });
});

$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('gelocation not supported by browser');
    }

    // disable button
    $locationButton.setAttribute('disabled', 'disabled');

    let location = {
        latitude: 0,
        longitude: 0,
    };
    navigator.geolocation.getCurrentPosition((position) => {
        location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
    })

    socket.emit('sendLocation', location, (message) => {
        console.log(message);
        $locationButton.removeAttribute('disabled');
    })

})