const socket = io();

// Elements
// Dollar sign is just a convention for DOM manipulation
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
// Qs.parse returns an object using the information in the query string
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true, // Remove the question mark in the query string
});

const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

// Renders message in the html template
socket.on('message', (message) => {
    // console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'), // Formats the time
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

// Sends the location URL to the browser
socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Disables button once it's submitted
    $messageFormButton.setAttribute('disabled', 'disabled');

    // Targets the message element in the form
    const message = e.target.elements.message.value;

    // param3: The function runs when the event is acknowledged
    socket.emit('sendMessage', message, (error) => {
        // Re-enables button once it's submitted
        $messageFormButton.removeAttribute('disabled');

        // Clears input after submitting the input
        $messageFormInput.value = '';

        // Moves focus of the cursor in the input field
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('Message delivered');
    });
});

$sendLocationButton.addEventListener('click', () => {
    // If this exists, it means that the browser used supports this
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            'sendLocation',
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                $sendLocationButton.removeAttribute('disabled');
                console.log('Location shared!');
            }
        );
    });
});

socket.emit('join', { username, room }, (error) => {
    // Shows error if there is any
    if (error) {
        alert(error);
        location.href = '/';
    }
});
