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
    }

    // Extract username from cookie and initialize room
    const cookieArr = document.cookie.split(';');
    for (let i = 0; i < cookieArr.length; i++) {
        let cookie = cookieArr[i].trim();
        if (cookie.startsWith('username=')) {
            currentUsername = cookie.substring('username'.length + 1);
            console.log(currentUsername);
            document.getElementById('username-modal').style.display = 'none';
            joinRoom('global'); // Default room
        }
    }

    if (currentUsername === '') {
        window.location.href = '../pages/login/login.html';
        return;
    }

    // Initialize chat functionality
    function initializeChat() {
        const inputField = document.getElementById("input");

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
    function sendMessage() {
        const input = document.getElementById('input');
        if (input && input.value && currentRoom) {
            socket.emit('chat message', {
                msg: input.value,
                room: currentRoom
            });
            input.value = ''; // Clear the input after sending the message
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
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = `${ data.user } joined the ${ data.room } room`;
        messages.appendChild(messageDiv);

        const count = data.count && (data.count.global || data.count.state)
            ? (currentRoom === 'global' ? data.count.global : data.count.state)
            : 0;

        document.getElementById('user-count').textContent = count;
    });

    // Handle user leaving a room
    socket.on('user left', (data) => {
        const messages = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.textContent = `${ data.user } left the ${ data.room } room`;
        messages.appendChild(messageDiv);

        const count = data.count && (data.count.global || data.count.state)
            ? (currentRoom === 'global' ? data.count.global : data.count.state)
            : 0;

        document.getElementById('user-count').textContent = count;
    });

    // Handle disconnect when user is closing the tab or navigating away
    function disconnectUser() {
        if (currentRoom && currentUsername) {
            console.log('Disconnecting user:', currentUsername, 'from room:', currentRoom);
            socket.emit('disconnect-user', { room: currentRoom, user: currentUsername });
        }
    }

    // Trigger a disconnect when the user is closing the tab or navigating away
    window.addEventListener('beforeunload', () => {
        disconnectUser(); // Disconnect when the page is about to unload
    });

    // Listen to page navigation or content change (when switching tabs)
    window.addEventListener('hashchange', () => {
        // Handle hashchange event for tab switching
        disconnectUser(); // Disconnect the user when navigating away via hash change
    });

    // Listen to back/forward navigation (popstate event)
    window.addEventListener('popstate', () => {
        // Handle back/forward navigation
        disconnectUser(); // Disconnect the user on navigating using browser history
    });
}
