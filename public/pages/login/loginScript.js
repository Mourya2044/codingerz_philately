export function initializeLogin() {
    const form = document.querySelector('#loginForm');
    const emailError = document.querySelector('.email.error');
    const passwordError = document.querySelector('.password.error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission

        // Reset errors
        emailError.textContent = '';
        passwordError.textContent = '';

        // Get the values
        const email = form.email.value;
        const password = form.password.value;

        try {
            const res = await fetch('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: { 'Content-Type': 'application/json' }
            });

            // Ensure the response is JSON
            const data = await res.json();
            // console.log(data);

            // Display errors if any
            if (data.errors) {
                emailError.textContent = data.errors.email || '';
                passwordError.textContent = data.errors.password || '';
            }

            // Redirect if login is successful
            if (data.user) {
                // If login is successful, check for the previous page stored in sessionStorage
                const previousPage = sessionStorage.getItem('previousPage') || '/home'; // Default to home if not found

                // Load the previous page or home page after login
                loadContent(previousPage.substring(1));  // Remove the leading '/' from the URL
            }

        } catch (error) {
            console.log(error);
        }
    });
}