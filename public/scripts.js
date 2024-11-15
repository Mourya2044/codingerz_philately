// scripts.js
function loadContent(page, skipPush = false) {
    fetch(`../pages/${page}/${page}.html`)
        .then(response => {
            if (!response.ok) throw new Error(`Page not found: ${page}`);
            return response.text();
        })
        .then(data => {
            document.getElementById("content").innerHTML = data;
            if (!skipPush) {
                history.pushState({ page: page }, '', `/${page}`);
            }

            // Scroll to the top after the content is loaded
            window.scrollTo(0, 0);

            // Get all tab links
            const tabs = document.querySelectorAll('.nav-menu a');

            // Remove 'active' class from all tabs
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });

            // Add 'active' class to the clicked tab
            const activeTab = document.getElementById(page);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("content").innerHTML = "<p>Page not found.</p>";
        });
}

// Listen to popstate to handle browser back button
window.onpopstate = (event) => {
    if (event.state && event.state.page) {
        loadContent(event.state.page, true); // Load content without pushing a new history state
    }
};

// On page load, check the URL and load the corresponding content
window.onload = function () {
    const path = window.location.pathname;

    if (path === "/" || path === "/index.html") {
        // If on root or index.html, load the 'home' content
        loadContent("home");
        history.replaceState({ page: "home" }, '', '/home'); // Update the URL to /home without reload
    } else {
        // For any other path, load the corresponding content
        loadContent(path.substring(1), true); // Skip pushing state on initial load
    }
};

const socket = io();
let currentUsername = '';
let currentRoom = '';

function setUsername() {
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();

    if (username) {
        currentUsername = username;
        document.getElementById('username-modal').style.display = 'none';
        joinRoom('global'); // Default room
    }
}

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

function joinRoom(room) {
    if (currentRoom) {
        document.getElementById(`${currentRoom}-btn`).classList.remove('active');
    }

    currentRoom = room;
    document.getElementById(`${room}-btn`).classList.add('active');
    document.getElementById('room-title').textContent =
        room === 'global' ? 'Global Community' : 'State Community';
    socket.emit('join room', { room, user: currentUsername });
    clearMessages();
    initializeChat();
    initializeDisconnect();
}

function clearMessages() {
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
}

const form = document.getElementById('form');
const input = document.getElementById('input');

function sendMessage() {
    // const form = document.getElementById('form');
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
};

socket.on('chat message', (data) => {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.user === currentUsername ? 'sent' : 'received'}`;

    messageDiv.innerHTML = `
                <div class="username">${data.user}</div>
                <div class="text-box">
                    <div class="text">${data.text}</div>
                    <div class="time">${data.time}</div>
                </div>
            `;

    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('user joined', (data) => {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.textContent = `${data.user} joined the ${data.room} room`;
    messages.appendChild(messageDiv);
    const count = currentRoom == 'global' ? data.count.global:data.count.state
    document.getElementById('user-count').textContent = count;
});

socket.on('user left', (data) => {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.textContent = `${data.user} left the ${data.room} room`;
    messages.appendChild(messageDiv);
    const count = currentRoom == 'global' ? data.count.global:data.count.state
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

// socket.on('user list', (users) => {
//     const usersList = document.getElementById('users-list');
//     usersList.innerHTML = '';
//     users.forEach(user => {
//         const li = document.createElement('li');
//         li.textContent = user;
//         usersList.appendChild(li);
//     });
// });
