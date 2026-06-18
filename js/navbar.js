document.addEventListener("DOMContentLoaded", () => {

    fetch("components/navbar.html")
        .then(response => {

            if (!response.ok) {
                throw new Error("Navbar could not be loaded");
            }

            return response.text();
        })

        .then(data => {
            document.getElementById("navbar-container").innerHTML = data;
        })

        .catch(error => {
            console.error(error);
        });

});