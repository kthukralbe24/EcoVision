/**
 * EcoVision - Smart Campus Circular Plastic Economy
 * Marketplace (Buy) Page Controller
 */

import { store } from './state.js';
import { Security } from './security.js';
import { PLASTIC_CATEGORIES } from './campus.js';

export class BuyPageController {
    constructor() {
        this.container = document.getElementById('productsContainer');
        this.typeFilter = document.getElementById('plasticTypeFilter');
        this.zoneFilter = document.getElementById('campusZoneFilter');
        this.sortFilter = document.getElementById('sortFilter');
        this.searchInput = document.getElementById('searchInput');

        this.searchTerm = '';
        this.debounceTimer = null;

        this.bindEvents();
        this.subscribe();
    }

    bindEvents() {
        if (this.typeFilter) {
            this.typeFilter.addEventListener('change', () => this.render());
        }
        if (this.zoneFilter) {
            this.zoneFilter.addEventListener('change', () => this.render());
        }
        if (this.sortFilter) {
            this.sortFilter.addEventListener('change', () => this.render());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.searchTerm = e.target.value.toLowerCase().trim();
                    this.render();
                }, 200);
            });
        }
    }

    subscribe() {
        store.subscribe(() => {
            this.render();
        });
    }

    getFilteredProducts() {
        const state = store.getState();
        let list = [...state.products];

        const type = this.typeFilter ? this.typeFilter.value : 'all';
        const zone = this.zoneFilter ? this.zoneFilter.value : 'all';
        const sort = this.sortFilter ? this.sortFilter.value : 'price-asc';

        if (type !== 'all') {
            list = list.filter(p => p.type === type);
        }

        if (zone !== 'all') {
            list = list.filter(p => p.campusZone === zone);
        }

        if (this.searchTerm) {
            list = list.filter(p => 
                p.name.toLowerCase().includes(this.searchTerm) ||
                p.description.toLowerCase().includes(this.searchTerm) ||
                p.zoneName.toLowerCase().includes(this.searchTerm)
            );
        }

        if (sort === 'price-asc') {
            list.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-desc') {
            list.sort((a, b) => b.price - a.price);
        } else if (sort === 'quantity-desc') {
            list.sort((a, b) => b.quantity - a.quantity);
        } else if (sort === 'credits-desc') {
            list.sort((a, b) => b.ecoCredits - a.ecoCredits);
        }

        return list;
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const products = this.getFilteredProducts();

        if (products.length === 0) {
            const noRes = document.createElement('div');
            noRes.className = 'no-results-wrap';
            
            const h3 = document.createElement('h3');
            h3.textContent = 'No Campus Plastic Inventory Matches Your Filters';
            
            const p = document.createElement('p');
            p.textContent = 'Try adjusting your plastic type or campus zone selection, or list new campus recyclables on the SELL page.';
            
            noRes.appendChild(h3);
            noRes.appendChild(p);
            this.container.appendChild(noRes);
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const product of products) {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.setAttribute('aria-label', product.name);

            // Image wrap
            const imgWrap = document.createElement('div');
            imgWrap.className = 'product-image-wrap';

            const img = document.createElement('img');
            img.className = 'product-card-img';
            img.src = Security.sanitizeURL(product.image) || 'images/recycle.png';
            img.alt = product.name;
            img.loading = 'lazy';
            img.width = 300;
            img.height = 190;

            const badgeBox = document.createElement('div');
            badgeBox.className = 'product-card-badges';

            const typeBadge = document.createElement('span');
            typeBadge.className = 'badge badge-campus';
            typeBadge.textContent = product.type;

            badgeBox.appendChild(typeBadge);
            imgWrap.appendChild(img);
            imgWrap.appendChild(badgeBox);

            // Card Body
            const body = document.createElement('div');
            body.className = 'product-body';

            const zoneTag = document.createElement('span');
            zoneTag.className = 'product-zone-tag';
            zoneTag.textContent = `📍 ${product.zoneName}`;

            const title = document.createElement('h2');
            title.className = 'product-title';
            title.textContent = product.name;

            const desc = document.createElement('p');
            desc.className = 'product-desc';
            desc.textContent = product.description;

            // Stats row
            const stats = document.createElement('div');
            stats.className = 'product-stats-row';

            const priceSpan = document.createElement('span');
            priceSpan.className = 'product-price-highlight';
            priceSpan.textContent = `₹${product.price}/kg`;

            const qtySpan = document.createElement('span');
            qtySpan.style.color = 'var(--text-muted)';
            qtySpan.textContent = `Stock: ${product.quantity}kg`;

            stats.appendChild(priceSpan);
            stats.appendChild(qtySpan);

            // Actions bar
            const actions = document.createElement('div');
            actions.className = 'product-actions-bar';

            const qtyCtrl = document.createElement('div');
            qtyCtrl.className = 'quantity-control';

            const decBtn = document.createElement('button');
            decBtn.className = 'qty-btn';
            decBtn.type = 'button';
            decBtn.setAttribute('aria-label', `Decrease quantity for ${product.name}`);
            decBtn.textContent = '−';

            const qtyInput = document.createElement('input');
            qtyInput.className = 'qty-input';
            qtyInput.type = 'number';
            qtyInput.value = '1';
            qtyInput.min = '1';
            qtyInput.max = String(product.quantity);
            qtyInput.setAttribute('aria-label', `Quantity in kg for ${product.name}`);

            const incBtn = document.createElement('button');
            incBtn.className = 'qty-btn';
            incBtn.type = 'button';
            incBtn.setAttribute('aria-label', `Increase quantity for ${product.name}`);
            incBtn.textContent = '+';

            decBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val > 1) qtyInput.value = String(val - 1);
            });

            incBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val < product.quantity) qtyInput.value = String(val + 1);
            });

            qtyInput.addEventListener('change', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val < 1) val = 1;
                if (val > product.quantity) val = product.quantity;
                qtyInput.value = String(val);
            });

            qtyCtrl.appendChild(decBtn);
            qtyCtrl.appendChild(qtyInput);
            qtyCtrl.appendChild(incBtn);

            const addBtn = document.createElement('button');
            addBtn.className = 'btn btn-primary';
            addBtn.style.flex = '1';
            addBtn.type = 'button';
            addBtn.textContent = 'Add to Cart';

            addBtn.addEventListener('click', () => {
                const qtyToAdd = parseInt(qtyInput.value) || 1;
                const result = store.addToCart(product.id, qtyToAdd);
                if (window.app && window.app.showToast) {
                    window.app.showToast(result.message, result.success ? 'success' : 'error');
                }
            });

            actions.appendChild(qtyCtrl);
            actions.appendChild(addBtn);

            body.appendChild(zoneTag);
            body.appendChild(title);
            body.appendChild(desc);
            body.appendChild(stats);
            body.appendChild(actions);

            card.appendChild(imgWrap);
            card.appendChild(body);
            fragment.appendChild(card);
        }

        this.container.appendChild(fragment);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BuyPageController();
});

