// scripts.js
function loadContent(page, skipPush = false) {
    fetch(`../pages/${ page }/${ page }.html`)
        .then(response => {
            if (!response.ok) throw new Error(`Page not found: ${ page }`);
            return response.text();
        })
        .then(data => {
            document.getElementById("content").innerHTML = data;

            if (!skipPush) {
                history.pushState({ page: page }, '', `/${ page }`);
            }

            window.scrollTo(0, 0);
            updateActiveTab(page);

            // Dynamically load the community script if needed
            if (page === "community") {
                const script = document.createElement("script");
                script.src = "../pages/community/communityscript.js";
                script.type = "module";
                script.onload = () => {
                    import("../pages/community/communityscript.js").then(module => {
                        module.initializeCommunityPage();
                    });
                };
                document.head.appendChild(script);
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById("content").innerHTML = `
                <div class="error-message">
                    <h2>Error</h2>
                    <p>The page "${ page }" could not be loaded.</p>
                </div>`;
        });
}

function updateActiveTab(page) {
    // Get all navigation menu links
    const tabs = document.querySelectorAll('.nav-menu a');

    // Remove 'active' class from all tabs
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Find the tab corresponding to the current page
    const activeTab = document.getElementById(page);

    // Add the 'active' class to the matching tab
    if (activeTab) {
        activeTab.classList.add('active');
    }
}


// Listen to popstate to handle browser back button
window.onpopstate = (event) => {
    if (event.state && event.state.page) {
        loadContent(event.state.page, true); // Load content without pushing a new history state
    }
};

// On page load, check the URL and load the corresponding content
window.addEventListener('load', () => {
    const path = window.location.pathname;
    const page = (path === "/" || path === "/index.html") ? "home" : path.substring(1);
    showUsername();
    loadContent(page, true);
    if (path === "/" || path === "/index.html") {
        history.replaceState({ page: "home" }, '', '/home');
    }
});


function showUsername() {
    const user = document.getElementById('user');
    const login = document.getElementById('login');
    const logout = document.getElementById('logout');

    let currentUsername = '';  // Use let here instead of const to allow reassignment

    const cookieArr = document.cookie.split(';');
    for (let i = 0; i < cookieArr.length; i++) {
        let cookie = cookieArr[i].trim();
        // Check if the cookie name matches 'username'
        if (cookie.startsWith('username=')) {
            currentUsername = cookie.substring('username'.length + 1); // Get the cookie value
        }
    }

    if (currentUsername) {
        // If the username exists in the cookie, show the user and logout buttons
        user.textContent = currentUsername;  // Assuming there's an element to display the username
        user.classList.remove('hide');
        logout.classList.remove('hide');
        login.classList.add('hide');
    } else {
        // If no username found, hide the user and logout buttons, and show login
        user.classList.add('hide');
        logout.classList.add('hide');
        login.classList.remove('hide');
    }
}

async function logout() {
    try {
        const res = await fetch('/logout', {  // Change this to match the correct server route
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
        });

        if (res.ok) {
            // Logout logic here...
            loadContent('home');
            // updateUIAfterLogout();
            showUsername();
        } else {
            console.error('Logout failed:', res.statusText);
        }
    } catch (error) {
        console.error('An error occurred during logout:', error);
    }
}
