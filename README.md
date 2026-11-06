# Perfect Mens Wear

A lightweight, static three-page menswear site built with HTML, CSS, and vanilla JavaScript. No build step or package installation is required.

## Run locally

Double-click `run-site.bat` on Windows to open the website in your default browser, or open `index.html` directly. No build step or package installation is required. The collection, category filters, order drawer, and saved cart work in the browser. The order flow opens WhatsApp with a pre-filled message; the customer must review and send it.

## Before publishing

1. In `site-config.js`, set the shop's WhatsApp number (country code plus digits, no `+`), phone, and opening hours. The supplied Google Maps shop link is already configured as `mapUrl`.
2. Replace the sample entries in `products.js` with confirmed products, sizes, prices, and photos. Starter catalog prices are illustrative only.
3. Replace the remote editorial photos with client-approved shop and product images. Confirm permission before using brand logos or catalogue imagery.
4. Update the contact location with the exact shop address, then test the order flow on mobile and desktop.

The site intentionally does not collect or process payments. Availability and final pricing should be confirmed by the store over WhatsApp.
