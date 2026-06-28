# CampusConnect

CampusConnect is a modern frontend web application designed to connect university students through a centralized digital platform. It provides a campus marketplace where students can buy and sell items, discover campus events, and interact with a clean, responsive user interface.

The project was built to demonstrate modern frontend development practices using HTML, CSS, JavaScript, Bootstrap, modular components, and JSON data handling.

---

## Features

- Responsive user interface
- Modular HTML component loading
- Campus marketplace
- Product cards generated dynamically from JSON data
- Product details page
- Search functionality
- Category filtering
- Responsive navigation bar
- Clean Bootstrap 5 design
- Client-side routing between pages
- Mock authentication (frontend)

---

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- AJAX
- Bootstrap 5
- Bootstrap Icons
- JSON
- Fetch API
- Local Storage (for mock authentication)

---

## Project Structure

```
CampusConnect
├── README.md
├── cart.html
├── checkout.html
├── clubs.html
├── components
│   ├── clubs-catalog.html
│   ├── clubs-hero-section.html
│   ├── events-hero-section.html
│   ├── features.html
│   ├── footer.html
│   ├── happening.html
│   ├── hero.html
│   ├── marketplace-hero-section.html
│   ├── marketplace-preview.html
│   └── navbar.html
├── css
│   └── style.css
├── data
│   ├── clubs.json
│   ├── events.json
│   └── marketplace.json
├── events.html
├── index.html
├── js
│   ├── app.js
│   ├── cart.js
│   ├── clubs.js
│   ├── component-loader.js
│   ├── events.js
│   └── marketplace.js
├── marketplace.html
├── news.html
├── notes.txt
└── structure.txt
```

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/robemike/CampusConnect.git
```

### Navigate into the project

```bash
cd CampusConnect
```

### Open the project

You can simply open `index.html` in your browser or use **VS Code Live Server**.

---

## Marketplace Data

Marketplace products are stored inside:

```text
data/marketplace.json
```

Products are loaded dynamically using the Fetch API.

Example product object:

```json
{
    "id": 1,
    "name": "Scientific Calculator",
    "price": 2500,
    "category": "Electronics",
    "seller": "John Doe",
    "image": "assets/images/calculator.jpg"
}
```

---

## Component-Based Architecture

Instead of duplicating HTML across pages, CampusConnect uses reusable HTML components loaded dynamically with JavaScript.

Examples include:

- Navigation Bar
- Footer
- Hero Section
- Features Section

This keeps the project cleaner and easier to maintain.

---

## Authentication

The application demonstrates frontend authentication using Local Storage.

Current functionality includes:

- User registration
- User login
- Session persistence
- Logout

Since this is a frontend project, authentication is not connected to a real backend.

---

## Future Improvements

Possible enhancements include:

- Backend integration
- Database support
- User messaging
- Product image uploads
- Wishlist
- Shopping cart
- Campus event management
- Notifications
- User profiles
- Admin dashboard
- Payment integration
- News Page

---

## Learning Objectives

This project demonstrates knowledge of:

- Responsive Web Design
- DOM Manipulation
- JavaScript Modules
- Fetch API
- JSON Handling
- Component-Based UI Design
- Local Storage
- Event Handling
- Clean Project Organization
- Bootstrap Layout System

## Author

**Mike Robe**

GitHub:
https://github.com/robemike

---

## License

This project is intended for educational and portfolio purposes.