# EcoVision

EcoVision is a smart-campus circular plastic marketplace demo. Students can browse campus recycling listings, create a listing, manage a cart, and explore campus sustainability metrics.

## Project Description

EcoVision is a web platform designed to facilitate the buying and selling of recyclable plastic materials. The platform connects buyers and sellers, making it easy to trade various types of plastics in an organized and user-friendly environment.

### Features
- Browse available plastic materials for purchase, with detailed product information and images.
- List your own plastic materials for sale, including type, quantity, location, and price.
- Filter and sort products by type, location, and price.
- Add products to a cart and simulate the checkout process.
- Responsive design for use on desktop and mobile devices.

## File Structure

```
plastic/
├── buy.html
├── index.html
├── sell.html
├── js/
│   ├── app.js
│   ├── state.js
│   ├── security.js
│   ├── buy.js
│   └── sell.js
├── styles/
│   ├── buy.css
│   ├── sell.css
│   └── index.css
├── images/
│   ├── pppp.jpg
│   ├── ps.png
│   ├── pp.png
│   ├── ldpe.png
│   ├── pvc.png
│   ├── hdpe2.png
│   ├── grade2.png
│   ├── hdpe.jpg
│   ├── pet.jpg
│   ├── recycle.png
│   └── plas.png
└── README.md
```

- All HTML files are in the root directory.
- All CSS files are in the `styles/` folder.
- All images are in the `images/` folder.
- JavaScript modules are in the `js/` folder. The application is a browser-only demonstration: account and marketplace data stay in local storage, so authentication, inventory, and checkout are not shared or authoritative across devices.

## Run locally

Requires Node.js 18 or newer.

```sh
npm start
```

Open [http://localhost:3000](http://localhost:3000). The site uses ES modules and a service worker, so use a local web server rather than opening the HTML files directly.

## Checks

```sh
npm test
npm run lint
npm run security-audit
```

## Deploy with GitHub Pages

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages**.
3. Choose **Deploy from a branch**, select the default branch and the repository root (`/`), then save.
4. Wait for the Pages deployment to finish and open the published URL over HTTPS.

The `.nojekyll` file keeps GitHub Pages from applying Jekyll processing. The `_headers` file supplies security headers on hosts that support this convention (including Cloudflare Pages and Netlify); GitHub Pages does not apply `_headers`, so its CSP and other meta policies still apply.

## Demo limits before a real launch

This is a static front-end demo. Accounts, password hashes, listings, cart state, and rewards are kept in each browser's local storage and can be changed by the browser owner. There is no shared database, trusted server-side authentication, payment processing, or authoritative stock control. Do not use it to handle real accounts, personal data, money, or orders without adding a backend and reviewing its security and privacy design.
