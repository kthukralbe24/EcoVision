/**
 * EcoVision - Smart Campus Circular Plastic Economy
 * Listing & Drop-off (Sell) Page Controller
 */

import { store } from './state.js';
import { Security } from './security.js';
import { CampusMetrics, PLASTIC_CATEGORIES, CAMPUS_ZONES } from './campus.js';

export class SellPageController {
    constructor() {
        this.initDOM();
        this.bindEvents();
        this.updateLivePreview();
    }

    initDOM() {
        this.form = document.getElementById('sellForm');
        this.dropzone = document.getElementById('imageDropzone');
        this.fileInput = document.getElementById('plasticImage');
        this.dropzonePreview = document.getElementById('dropzonePreview');
        this.dropzoneContent = document.getElementById('dropzoneContent');
        this.successCard = document.getElementById('successCard');

        // Form inputs
        this.plasticTypeSelect = document.getElementById('plasticType');
        this.quantityInput = document.getElementById('quantity');
        this.priceInput = document.getElementById('price');
        this.zoneSelect = document.getElementById('campusZone');
        this.contactNameInput = document.getElementById('contactName');
        this.studentIdInput = document.getElementById('studentId');
        this.contactPhoneInput = document.getElementById('contactPhone');
        this.contactEmailInput = document.getElementById('contactEmail');
        this.hostelSelect = document.getElementById('hostelSelect');

        // Preview elements
        this.prevImg = document.getElementById('previewCardImg');
        this.prevTypeBadge = document.getElementById('prevTypeBadge');
        this.prevZone = document.getElementById('prevZone');
        this.prevTitle = document.getElementById('prevTitle');
        this.prevQty = document.getElementById('prevQty');
        this.prevPrice = document.getElementById('prevPrice');
        this.prevCredits = document.getElementById('prevCredits');
        this.prevSeller = document.getElementById('prevSeller');

        this.uploadedImageData = null;
    }

    bindEvents() {
        // Image dropzone click & drag
        if (this.dropzone && this.fileInput) {
            this.dropzone.addEventListener('click', () => this.fileInput.click());
            this.dropzone.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.fileInput.click();
                }
            });

            this.dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.dropzone.classList.add('dragover');
            });

            this.dropzone.addEventListener('dragleave', () => {
                this.dropzone.classList.remove('dragover');
            });

            this.dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.dropzone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });

            this.fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFileSelected(e.target.files[0]);
                }
            });
        }

        // Live input listeners for preview updates
        const inputs = [
            this.plasticTypeSelect,
            this.quantityInput,
            this.priceInput,
            this.zoneSelect,
            this.contactNameInput,
            this.studentIdInput,
            this.hostelSelect
        ];

        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.updateLivePreview());
                input.addEventListener('change', () => this.updateLivePreview());
            }
        });

        // Form Submit
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    handleFileSelected(file) {
        // OWASP client-side file security validation
        const check = Security.validateImageFile(file);
        if (!check.valid) {
            if (window.app) window.app.showToast(check.error, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedImageData = e.target.result;
            if (this.dropzonePreview) {
                this.dropzonePreview.src = this.uploadedImageData;
                this.dropzonePreview.style.display = 'block';
            }
            if (this.dropzoneContent) {
                this.dropzoneContent.style.display = 'none';
            }
            this.updateLivePreview();
        };
        reader.readAsDataURL(file);
    }

    updateLivePreview() {
        const type = this.plasticTypeSelect?.value || 'PET';
        const qty = parseInt(this.quantityInput?.value) || 10;
        const price = parseInt(this.priceInput?.value) || 15;
        const zoneId = this.zoneSelect?.value || 'north_dorms';
        const seller = this.contactNameInput?.value || 'Campus Student';
        const studentId = this.studentIdInput?.value || 'STU-ID';

        const category = PLASTIC_CATEGORIES[type] || PLASTIC_CATEGORIES.PET;
        const zone = CAMPUS_ZONES.find(z => z.id === zoneId) || CAMPUS_ZONES[0];
        const credits = CampusMetrics.calculateEcoCredits(type, qty);

        if (this.prevTypeBadge) this.prevTypeBadge.textContent = type;
        if (this.prevZone) this.prevZone.textContent = `📍 ${zone.name}`;
        if (this.prevTitle) this.prevTitle.textContent = `${category.name} Waste`;
        if (this.prevQty) this.prevQty.textContent = `${qty} kg`;
        if (this.prevPrice) this.prevPrice.textContent = `₹${price}/kg`;
        if (this.prevCredits) this.prevCredits.textContent = `+${credits} EcoCredits`;
        if (this.prevSeller) this.prevSeller.textContent = `${seller} (${studentId})`;

        if (this.prevImg) {
            if (this.uploadedImageData) {
                this.prevImg.src = this.uploadedImageData;
            } else {
                // Fallback to stock category image
                const fallbackMap = {
                    PET: 'images/pet.jpg',
                    HDPE: 'images/hdpe2.png',
                    PVC: 'images/pvc.png',
                    LDPE: 'images/ldpe.png',
                    PP: 'images/pp.png',
                    PS: 'images/ps.png',
                    PLA_3D: 'images/grade2.png'
                };
                this.prevImg.src = fallbackMap[type] || 'images/recycle.png';
            }
        }
    }

    handleFormSubmit() {
        const type = this.plasticTypeSelect?.value;
        const quantity = Number(this.quantityInput?.value);
        const price = Number(this.priceInput?.value);
        const campusZone = this.zoneSelect?.value;
        const contactName = this.contactNameInput?.value;
        const studentId = this.studentIdInput?.value;
        const contactPhone = this.contactPhoneInput?.value;
        const contactEmail = this.contactEmailInput?.value;
        const hostel = this.hostelSelect?.value;

        // Validation
        if (!type || !quantity || !price || !campusZone || !contactName || !studentId) {
            if (window.app) window.app.showToast('Please complete all required fields.', 'error');
            return;
        }

        if (quantity < 1 || quantity > 500) {
            if (window.app) window.app.showToast('Quantity must be between 1 and 500 kg for campus drop-offs.', 'error');
            return;
        }

        if (price < 1 || price > 200) {
            if (window.app) window.app.showToast('Price must be between ₹1 and ₹200 per kg.', 'error');
            return;
        }

        if (contactPhone && !Security.validatePhone(contactPhone)) {
            if (window.app) window.app.showToast('Please provide a valid contact phone number (10-14 digits).', 'error');
            return;
        }

        if (contactEmail) {
            const emailCheck = Security.validateEmail(contactEmail);
            if (!emailCheck.valid) {
                if (window.app) window.app.showToast('Please provide a valid campus email address.', 'error');
                return;
            }
        }

        // Add to Store
        const imageToSave = this.uploadedImageData || (
            type === 'PET' ? 'images/pet.jpg' :
            type === 'HDPE' ? 'images/hdpe2.png' :
            type === 'PVC' ? 'images/pvc.png' :
            type === 'LDPE' ? 'images/ldpe.png' :
            type === 'PP' ? 'images/pp.png' :
            type === 'PS' ? 'images/ps.png' :
            'images/grade2.png'
        );

        const newListing = store.addListing({
            type,
            quantity,
            price,
            campusZone,
            contactName,
            studentId,
            contactPhone,
            contactEmail,
            hostel,
            image: imageToSave
        });

        // Display success confirmation
        if (this.successCard) {
            this.successCard.classList.add('active');
            this.successCard.scrollIntoView({ behavior: 'smooth' });
        }

        if (window.app) {
            window.app.showToast(`Listing published! Your hostel earned green points and +${newListing.ecoCredits} EcoCredits have been credited!`, 'success');
        }

        // Reset form
        this.form.reset();
        this.uploadedImageData = null;
        if (this.dropzonePreview) {
            this.dropzonePreview.src = '';
            this.dropzonePreview.style.display = 'none';
        }
        if (this.dropzoneContent) {
            this.dropzoneContent.style.display = 'block';
        }
        this.updateLivePreview();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SellPageController();
});

