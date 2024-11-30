export function initializeCommunityPage() {

    const socket = io();
    let currentUsername = '';
    let currentRoom = '';

    // Join room and manage room switching
    window.joinRoom = function (room) {
        if (currentRoom) {
            document.getElementById(`${ currentRoom }-btn`).classList.remove('active');
        }

        currentRoom = room;
        document.getElementById(`${ room }-btn`).classList.add('active');
        document.getElementById('room-title').textContent =
            room === 'global' ? 'Global Community' : 'State Community';
        socket.emit('join room', { room, user: currentUsername });
        clearMessages();
        initializeChat();
        initializeDisconnect();
    }

    // Extract username from cookie and initialize room
    const cookieArr = document.cookie.split(';');
    for (let i = 0; i < cookieArr.length; i++) {
        let cookie = cookieArr[i].trim();
        // Check if the cookie name matches the desired name
        if (cookie.startsWith('username' + '=')) {
            currentUsername = cookie.substring('username'.length + 1); // Return the cookie value
            document.getElementById('username-modal').style.display = 'none';
            joinRoom('global'); // Default room
        }
    }

    // Initialize chat functionality
    function initializeChat() {
        const inputField = document.getElementById("input");

        // Attach event listener for the Enter key
        inputField.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault(); // Prevent any default behavior
                sendMessage(); // Trigger the message sending function
            }
        });
    }

    // Clear messages from the chat
    function clearMessages() {
        const messages = document.getElementById('messages');
        messages.innerHTML = '';
    }

    // Send a message to the room
    const form = document.getElementById('form');
    const input = document.getElementById('input');

    function sendMessage() {
        const input = document.getElementById('input');

        if (input) {
            if (input.value && currentRoom) {
                socket.emit('chat message', {
                    msg: input.value,
                    room: currentRoom
                });
                input.value = ''; // Clear the input after sending the message
            }
        } else {
            console.error("Form or input element not found.");
        }
    }

    // Handle received messages
    socket.on('chat message', (data) => {
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${ data.user === currentUsername ? 'sent' : 'received' }`;

        messageDiv.innerHTML = `
            <div class="username">${ data.user }</div>
            <div class="text-box">
                <div class="text">${ data.text }</div>
                <div class="time">${ data.time }</div>
            </div>
        `;

        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    });

    // Handle user joining a room
    socket.on('user joined', (data) => {
        console.log('User joined data:', data); // Debugging log
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = `${ data.user } joined the ${ data.room } room`;
        messages.appendChild(messageDiv);

        // Ensure data.count is valid and has the expected properties
        const count = data.count && (data.count.global || data.count.state)
            ? (currentRoom === 'global' ? data.count.global : data.count.state)
            : 0;

        document.getElementById('user-count').textContent = count;
    });

    // Handle user leaving a room
    socket.on('user left', (data) => {
        console.log('User left data:', data); // Debugging log
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = `${ data.user } left the ${ data.room } room`;
        messages.appendChild(messageDiv);

        // Ensure data.count is valid and has the expected properties
        const count = data.count && (data.count.global || data.count.state)
            ? (currentRoom === 'global' ? data.count.global : data.count.state)
            : 0;

        document.getElementById('user-count').textContent = count;
    });

    // Trigger a disconnect when the user is closing the tab or navigating away
    window.addEventListener('beforeunload', () => {
        if (currentRoom && currentUsername) {
            socket.emit('disconnect-user', { room: currentRoom, user: currentUsername });
        }
    });

    // On page load, initialize the disconnect functionality
    function initializeDisconnect() {
        window.addEventListener('beforeunload', function (event) {
            if (currentRoom && currentUsername) {
                socket.emit('disconnect-user', { room: currentRoom, user: currentUsername });
            }
        });
    }
}
