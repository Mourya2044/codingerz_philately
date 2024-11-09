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
