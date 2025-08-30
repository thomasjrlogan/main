/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface EditableContentState {
    originalHTML: string;
    currentHTML: string;
    element: HTMLElement; // The span holding the text
    controlsContainer: HTMLElement;
    editButton: HTMLButtonElement;
    saveButton: HTMLButtonElement;
    cancelButton: HTMLButtonElement;
}

interface SiteSettingConfig {
    displayElement: HTMLElement | null;
    inputElement: HTMLInputElement | null;
    originalValue: string;
    currentValue: string;
    isHref?: boolean;
    hrefPrefix?: string;
    displaySuffixElement?: HTMLElement | null; 
    inputSuffixElement?: HTMLInputElement | null;
    originalSuffixValue?: string;
    currentSuffixValue?: string;
}

interface PortfolioItem {
    id: string;
    title: string;
    imageSrc: string;
}

interface ServiceItem {
    id: string;
    title: string;
    description: string;
}

interface GalleryItem {
    id: string;
    type: 'image' | 'video';
    src: string; // data:URL
    title: string;
    fileType: string; // e.g., 'image/jpeg' or 'video/mp4'
}

interface SlideshowItem {
    id: string;
    src: string;
}

interface SlideshowManagerConfig {
    containerId: string;
    dotsId: string;
    adminListId: string;
    addFormId: string;
    fileInputId: string;
    statusMessageId: string;
    storageKey: string;
    defaultItems: SlideshowItem[];
}


document.addEventListener('DOMContentLoaded', () => {
    // LocalStorage Keys
    const LS_KEYS = {
        EDITABLE_CONTENT: 'logan-design-editable-content',
        SITE_SETTINGS: 'logan-design-site-settings',
        SLIDESHOW: 'logan-design-slideshow',
        PORTFOLIO_SLIDESHOW: 'logan-design-portfolio-slideshow',
        ABOUT_SLIDESHOW: 'logan-design-about-slideshow',
        PORTFOLIO: 'logan-design-portfolio',
        GALLERY: 'logan-design-gallery',
        SERVICES: 'logan-design-services',
        SITE_LOGO: 'logan-design-site-logo'
    };

    const navLinks = document.querySelectorAll<HTMLAnchorElement>('nav ul li a.nav-link');
    const contentSections = document.querySelectorAll<HTMLElement>('.content-section');
    const quoteForm = document.getElementById('quoteForm') as HTMLFormElement;
    const currentYearSpan = document.getElementById('currentYear');
    const headerElement = document.querySelector('header') as HTMLElement;
    const shareButton = document.getElementById('shareButton') as HTMLButtonElement;
    const headerLogoImage = document.getElementById('headerLogoImage') as HTMLImageElement;

    // Admin Panel Elements
    const adminLoginForm = document.getElementById('adminLoginForm') as HTMLFormElement;
    const adminLoginError = document.getElementById('adminLoginError') as HTMLDivElement;
    const adminUsernameInput = document.getElementById('adminUsername') as HTMLInputElement;
    const adminPasswordInput = document.getElementById('adminPassword') as HTMLInputElement;
    const adminLogoutButton = document.getElementById('adminLogoutButton') as HTMLButtonElement;
    const adminLoginFooterLink = document.getElementById('adminLoginFooterLink') as HTMLAnchorElement;
    const forgotPasswordLink = document.getElementById('forgotPasswordLink') as HTMLAnchorElement;

    // Site Settings Form Elements
    const siteSettingsForm = document.getElementById('siteSettingsForm') as HTMLFormElement;
    const siteSettingsStatusMessage = document.getElementById('siteSettingsStatusMessage') as HTMLDivElement;
    const siteLogoInput = document.getElementById('siteLogoInput') as HTMLInputElement;
    const siteLogoStatusMessage = document.getElementById('siteLogoStatusMessage') as HTMLDivElement;
    
    // Services Management Elements
    const servicesGridElement = document.getElementById('servicesGrid') as HTMLElement;
    const homeServicesGridElement = document.getElementById('homeServicesGrid') as HTMLElement;
    const addServiceForm = document.getElementById('addServiceForm') as HTMLFormElement;
    const serviceTitleInput = document.getElementById('serviceTitleInput') as HTMLInputElement;
    const serviceDescriptionInput = document.getElementById('serviceDescriptionInput') as HTMLTextAreaElement;
    const addServiceStatusMessage = document.getElementById('addServiceStatusMessage') as HTMLDivElement;
    const adminServicesListElement = document.getElementById('adminServicesList') as HTMLDivElement;

    // Portfolio Management Elements
    const portfolioGridElement = document.querySelector<HTMLElement>('#portfolio .portfolio-grid');
    const addPortfolioItemForm = document.getElementById('addPortfolioItemForm') as HTMLFormElement;
    const portfolioImageInput = document.getElementById('portfolioImageInput') as HTMLInputElement;
    const portfolioTitleInput = document.getElementById('portfolioTitleInput') as HTMLInputElement;
    const addPortfolioStatusMessage = document.getElementById('addPortfolioStatusMessage') as HTMLDivElement;
    const adminPortfolioItemsListElement = document.getElementById('adminPortfolioItemsList') as HTMLDivElement;
    
    // Gallery Management Elements
    const galleryGridElement = document.getElementById('galleryGrid') as HTMLElement;
    const addGalleryItemForm = document.getElementById('addGalleryItemForm') as HTMLFormElement;
    const galleryFileInput = document.getElementById('galleryFileInput') as HTMLInputElement;
    const galleryTitleInput = document.getElementById('galleryTitleInput') as HTMLInputElement;
    const addGalleryStatusMessage = document.getElementById('addGalleryStatusMessage') as HTMLDivElement;
    const adminGalleryItemsListElement = document.getElementById('adminGalleryItemsList') as HTMLDivElement;
    
    // Lightbox Elements
    const lightbox = document.getElementById('lightbox') as HTMLDivElement;
    const lightboxImage = document.getElementById('lightboxImage') as HTMLImageElement;
    const lightboxCaption = document.getElementById('lightboxCaption') as HTMLDivElement;
    const lightboxClose = document.querySelector('.lightbox-close') as HTMLElement;

    let isAdminLoggedIn = false;
    const ADMIN_USERNAME = "LOGAN'S DESIGN"; 
    const ADMIN_PASSWORD = "LOGAN'S"; 

    const editableElementsState = new Map<string, EditableContentState>();
    const siteSettingsConfig = new Map<string, SiteSettingConfig>();

    let portfolioItems: PortfolioItem[] = [];
    let galleryItems: GalleryItem[] = [];
    let serviceItems: ServiceItem[] = [];
    let currentLogoSrc = '';
    let pendingLogoSrc = '';


    // --- Persistence Functions ---
    function saveEditableContent() {
        const stateToSave: { [key: string]: string } = {};
        editableElementsState.forEach((state, key) => {
            stateToSave[key] = state.currentHTML;
        });
        localStorage.setItem(LS_KEYS.EDITABLE_CONTENT, JSON.stringify(stateToSave));
    }

    function loadEditableContent() {
        const savedStateJSON = localStorage.getItem(LS_KEYS.EDITABLE_CONTENT);
        if (!savedStateJSON) return;
        try {
            const savedState = JSON.parse(savedStateJSON);
            for (const id in savedState) {
                if (editableElementsState.has(id)) {
                    const state = editableElementsState.get(id)!;
                    state.currentHTML = savedState[id];
                    state.element.innerHTML = savedState[id];
                }
            }
        } catch (e) {
            console.error('Failed to load editable content from storage', e);
        }
    }

    function saveSiteSettings() {
        const settingsToSave: { [key: string]: { currentValue: string; currentSuffixValue?: string } } = {};
        siteSettingsConfig.forEach((config, key) => {
            settingsToSave[key] = {
                currentValue: config.currentValue,
                currentSuffixValue: config.currentSuffixValue,
            };
        });
        localStorage.setItem(LS_KEYS.SITE_SETTINGS, JSON.stringify(settingsToSave));
    }

    function loadSiteSettings() {
        const savedSettingsJSON = localStorage.getItem(LS_KEYS.SITE_SETTINGS);
        if (!savedSettingsJSON) return;
        try {
            const savedSettings = JSON.parse(savedSettingsJSON);
            for (const key in savedSettings) {
                if (siteSettingsConfig.has(key)) {
                    const config = siteSettingsConfig.get(key)!;
                    config.currentValue = savedSettings[key].currentValue;
                    if (savedSettings[key].currentSuffixValue !== undefined) {
                        config.currentSuffixValue = savedSettings[key].currentSuffixValue;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load site settings from storage', e);
        }
    }

    function savePortfolio() {
        localStorage.setItem(LS_KEYS.PORTFOLIO, JSON.stringify(portfolioItems));
    }

    function loadPortfolio() {
        const savedPortfolioJSON = localStorage.getItem(LS_KEYS.PORTFOLIO);
        if (savedPortfolioJSON) {
            try {
                portfolioItems = JSON.parse(savedPortfolioJSON);
            } catch (e) {
                console.error('Failed to load portfolio from storage', e);
                portfolioItems = [];
            }
        }
    }

    function saveGallery() {
        localStorage.setItem(LS_KEYS.GALLERY, JSON.stringify(galleryItems));
    }

    function loadGallery() {
        const savedGalleryJSON = localStorage.getItem(LS_KEYS.GALLERY);
        if (savedGalleryJSON) {
            try {
                const parsed = JSON.parse(savedGalleryJSON);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    galleryItems = parsed;
                    return; // Exit if we successfully loaded items
                }
            } catch (e) {
                console.error('Failed to load gallery from storage', e);
            }
        }
        // If storage was empty or invalid, load defaults
        galleryItems = [
             { 
                id: 'gallery-default-1', 
                type: 'image', 
                src: 'https://images.unsplash.com/photo-1512295767273-b684ac7658fa?q=80&w=1974&auto=format&fit=crop', 
                title: 'Modern Workspace Design',
                fileType: 'image/jpeg' 
            },
            { 
                id: 'gallery-default-2', 
                type: 'image', 
                src: 'https://images.unsplash.com/photo-1516116216624-53e6973bea12?q=80&w=2070&auto=format&fit=crop', 
                title: 'Creative Tools & Branding',
                fileType: 'image/jpeg' 
            },
            { 
                id: 'gallery-default-3', 
                type: 'video', 
                src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                title: 'Design Process Reel',
                fileType: 'video/mp4' 
            },
             { 
                id: 'gallery-default-4', 
                type: 'image', 
                src: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop', 
                title: 'Digital Branding Mockup',
                fileType: 'image/jpeg' 
            }
        ];
        saveGallery();
    }
    
    function saveServices() {
        localStorage.setItem(LS_KEYS.SERVICES, JSON.stringify(serviceItems));
    }

    function loadServices() {
        const savedServicesJSON = localStorage.getItem(LS_KEYS.SERVICES);
        if (savedServicesJSON) {
            try {
                serviceItems = JSON.parse(savedServicesJSON);
            } catch (e) {
                console.error('Failed to load services from storage', e);
                serviceItems = [];
            }
        } else {
            // Default services if none are in storage
            serviceItems = [
                { id: 'service-1', title: 'Graphic Design', description: 'Logos, brochures, business cards, posters, and all your marketing material needs. We create visually stunning graphics that capture attention.' },
                { id: 'service-7', title: '3D LOGO Design', description: 'Bring your brand to life with stunning 3D logos that stand out. We create dynamic and modern logos with depth and dimension.' },
                { id: 'service-2', title: 'Branding', description: 'Comprehensive brand identity development, including strategy, guidelines, and visual assets to build a strong and memorable brand presence.' },
                { id: 'service-3', title: 'Printing', description: 'High-quality printing services for business cards, flyers, banners, and other promotional materials. We ensure your designs look great on paper.' },
                { id: 'service-4', title: 'Interior Decoration', description: 'Transforming residential and commercial spaces with creative and functional interior design solutions that reflect your style.' },
                { id: 'service-5', title: 'Fashion Design', description: 'Innovative fashion design services, from concept development and sketching to pattern making and collection creation.' },
                { id: 'service-6', title: 'Web Design', description: 'User-friendly, responsive, and aesthetically pleasing website design and development. We build engaging digital experiences.' }
            ];
            saveServices();
        }
    }

    function saveLogo() {
        if (currentLogoSrc) {
            localStorage.setItem(LS_KEYS.SITE_LOGO, currentLogoSrc);
        }
    }

    function loadLogo() {
        const savedSrc = localStorage.getItem(LS_KEYS.SITE_LOGO);
        if (savedSrc && headerLogoImage) {
            currentLogoSrc = savedSrc;
            headerLogoImage.src = savedSrc;
        }
    }


    // --- Helper Functions ---
    function showAdminStatusMessage(element: HTMLElement | null, message: string, isError: boolean = false, duration: number = 3000) {
        if (!element) return;
        element.textContent = message;
        element.className = 'form-status-message'; // Reset classes
        if (isError) {
            element.classList.add('visible'); 
            element.style.color = 'var(--error-color)';
            element.style.backgroundColor = '#fdd';
            element.style.borderColor = 'var(--error-color)';
        } else {
            element.classList.add('visible');
            element.style.color = 'var(--success-color)';
            element.style.backgroundColor = '#e6ffed';
            element.style.borderColor = 'var(--success-color)';
        }
        
        setTimeout(() => {
            element.classList.remove('visible');
            element.textContent = '';
            element.style.color = ''; 
            element.style.backgroundColor = '';
            element.style.borderColor = '';
        }, duration);
    }

    // --- Site Settings & Logo---
    function initializeSiteSettings() {
        const settingsToTrack: Array<{
            key: string, 
            displayId: string, 
            inputId: string, 
            isHref?: boolean, 
            hrefPrefix?: string,
            displaySuffixId?: string,
            inputSuffixId?: string  
        }> = [
            { key: 'siteTitle', displayId: 'siteTitleDisplay', inputId: 'adminSiteTitleInput' },
            { key: 'contactEmail', displayId: 'contactEmailDisplay', inputId: 'adminContactEmailInput', isHref: true, hrefPrefix: 'mailto:' },
            { key: 'contactEmailSecondary', displayId: 'contactEmailSecondaryDisplay', inputId: 'adminContactEmailSecondaryInput', isHref: true, hrefPrefix: 'mailto:' },
            { 
                key: 'primaryPhone', 
                displayId: 'contactPrimaryPhoneDisplay', 
                inputId: 'adminPrimaryPhoneInput', 
                isHref: true, 
                hrefPrefix: 'tel:',
                displaySuffixId: 'contactPrimaryPhoneSuffixDisplay',
                inputSuffixId: 'adminPrimaryPhoneSuffixInput'
            },
            { key: 'facebookUrl', displayId: 'facebookLink', inputId: 'adminFacebookUrlInput', isHref: true },
            { key: 'instagramUrl', displayId: 'instagramLink', inputId: 'adminInstagramUrlInput', isHref: true },
            { key: 'linkedInUrl', displayId: 'linkedInLink', inputId: 'adminLinkedInUrlInput', isHref: true },
            { key: 'twitterUrl', displayId: 'twitterLink', inputId: 'adminTwitterUrlInput', isHref: true },
        ];

        settingsToTrack.forEach(setting => {
            const displayElement = document.getElementById(setting.displayId) as HTMLElement;
            const inputElement = document.getElementById(setting.inputId) as HTMLInputElement;
            let displaySuffixElement = null;
            let inputSuffixElement = null;

            if (setting.displaySuffixId && setting.inputSuffixId) {
                displaySuffixElement = document.getElementById(setting.displaySuffixId) as HTMLElement;
                inputSuffixElement = document.getElementById(setting.inputSuffixId) as HTMLInputElement;
            }

            if (displayElement && inputElement) {
                const originalValue = displayElement.textContent || '';
                const originalSuffixValue = displaySuffixElement ? (displaySuffixElement.textContent || '') : undefined;
                
                siteSettingsConfig.set(setting.key, {
                    displayElement,
                    inputElement,
                    originalValue,
                    currentValue: originalValue,
                    isHref: setting.isHref,
                    hrefPrefix: setting.hrefPrefix,
                    displaySuffixElement: displaySuffixElement || undefined,
                    inputSuffixElement: inputSuffixElement || undefined,
                    originalSuffixValue: originalSuffixValue,
                    currentSuffixValue: originalSuffixValue,
                });
            } else {
                console.warn(`Site setting elements not found for key: ${setting.key}`);
            }
        });
        loadSiteSettings();
        loadAdminFormFromState(); 
        updateSiteDisplayFromState(); 
    }

    function loadAdminFormFromState() {
        siteSettingsConfig.forEach(config => {
            if (config.inputElement) {
                 if (config.isHref && (config.displayElement as HTMLAnchorElement).href.startsWith('http')) {
                    config.inputElement.value = (config.displayElement as HTMLAnchorElement).href;
                } else {
                    config.inputElement.value = config.currentValue;
                }
            }
            if (config.inputSuffixElement && typeof config.currentSuffixValue === 'string') {
                config.inputSuffixElement.value = config.currentSuffixValue;
            }
        });
    }

    function updateSiteDisplayFromState() {
        siteSettingsConfig.forEach(config => {
            if (config.displayElement) {
                if (config.isHref) {
                    (config.displayElement as HTMLAnchorElement).href = config.hrefPrefix ? config.hrefPrefix + config.currentValue : config.currentValue;
                    if (!config.hrefPrefix) { // For social links, don't change text content
                        return;
                    }
                }
                config.displayElement.textContent = config.currentValue;
            }
            if (config.displaySuffixElement && typeof config.currentSuffixValue === 'string') {
                config.displaySuffixElement.textContent = config.currentSuffixValue;
            }
        });
    }

    function handleSaveSiteSettings(event: Event) {
        event.preventDefault();
        if (!isAdminLoggedIn) return;
    
        // Save text-based settings
        siteSettingsConfig.forEach(config => {
            if (config.inputElement) {
                config.currentValue = config.inputElement.value;
            }
            if (config.inputSuffixElement && typeof config.currentSuffixValue === 'string') {
                config.currentSuffixValue = config.inputSuffixElement.value;
            }
        });
        updateSiteDisplayFromState();
        saveSiteSettings();
    
        // Save the logo if a new one is pending
        if (pendingLogoSrc) {
            currentLogoSrc = pendingLogoSrc;
            saveLogo();
            pendingLogoSrc = ''; // Clear pending src
            if (siteLogoInput) {
                siteLogoInput.value = ''; // Clear file input visually
            }
            // Clear the specific logo status message now that it's saved
            if (siteLogoStatusMessage) {
                siteLogoStatusMessage.classList.remove('visible');
                siteLogoStatusMessage.textContent = '';
            }
        }
    
        showAdminStatusMessage(siteSettingsStatusMessage, 'Site settings saved successfully!');
    }
    
    function handleLogoUpdate(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!isAdminLoggedIn || !input.files || input.files.length === 0) {
            return;
        }
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result && headerLogoImage) {
                // Set the pending source and update the preview, but don't save yet
                pendingLogoSrc = e.target.result as string;
                headerLogoImage.src = pendingLogoSrc;
                showAdminStatusMessage(siteLogoStatusMessage, 'Logo preview updated. Click "Save Site Settings" to apply.', false, 5000);
            }
        };
        reader.onerror = () => {
             showAdminStatusMessage(siteLogoStatusMessage, 'Error reading file.', true);
        };
        reader.readAsDataURL(file);
    }

    function initializeLogo() {
        loadLogo();
        if (siteLogoInput) {
            siteLogoInput.addEventListener('change', handleLogoUpdate);
        }
    }

    // --- Content Editable Spans ---
    function createEditControlButton(text: string, className: string, editableId: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.type = 'button'; 
        button.classList.add('edit-control-button', className);
        button.dataset.editableId = editableId;
        return button;
    }
    
    function initializeEditableElements() {
        const editableSpans = document.querySelectorAll<HTMLElement>('span[data-editable-content-id]');
        editableSpans.forEach(span => {
            const editableId = span.dataset.editableContentId;
            if (!editableId) return;

            const controlsContainer = document.querySelector<HTMLElement>(`.edit-controls-container[data-controls-for="${editableId}"]`);
            if (!controlsContainer) {
                console.warn(`No controls container found for ${editableId}`);
                return;
            }

            const editButton = createEditControlButton('Edit', 'edit-button', editableId);
            const saveButton = createEditControlButton('Save', 'save-button', editableId);
            const cancelButton = createEditControlButton('Cancel', 'cancel-button', editableId);

            saveButton.style.display = 'none';
            cancelButton.style.display = 'none';

            controlsContainer.innerHTML = ''; 
            controlsContainer.append(editButton, saveButton, cancelButton);
            
            editableElementsState.set(editableId, {
                originalHTML: span.innerHTML,
                currentHTML: span.innerHTML,
                element: span,
                controlsContainer,
                editButton,
                saveButton,
                cancelButton,
            });

            editButton.addEventListener('click', () => startEdit(editableId));
            saveButton.addEventListener('click', () => saveEdit(editableId));
            cancelButton.addEventListener('click', () => cancelEdit(editableId));
        });
        loadEditableContent();
        updateEditControlsVisibility(); 
    }

    function updateEditControlsVisibility() {
        editableElementsState.forEach(state => {
            if (isAdminLoggedIn) {
                state.controlsContainer.style.display = 'flex';
                state.controlsContainer.classList.add('visible-for-admin');
            } else {
                state.controlsContainer.style.display = 'none';
                state.controlsContainer.classList.remove('visible-for-admin');
                if (state.element.isContentEditable) {
                    state.element.contentEditable = 'false';
                    state.editButton.style.display = 'inline-block';
                    state.saveButton.style.display = 'none';
                    state.cancelButton.style.display = 'none';
                }
            }
        });
    }
    
    function startEdit(editableId: string) {
        const state = editableElementsState.get(editableId);
        if (!state || !isAdminLoggedIn) return;
        state.element.contentEditable = 'true';
        state.element.focus();
        state.editButton.style.display = 'none';
        state.saveButton.style.display = 'inline-block';
        state.cancelButton.style.display = 'inline-block';
    }

    function saveEdit(editableId: string) {
        const state = editableElementsState.get(editableId);
        if (!state || !isAdminLoggedIn) return;
        state.currentHTML = state.element.innerHTML;
        state.element.contentEditable = 'false';
        state.editButton.style.display = 'inline-block';
        state.saveButton.style.display = 'none';
        state.cancelButton.style.display = 'none';
        saveEditableContent();
    }

    function cancelEdit(editableId: string) {
        const state = editableElementsState.get(editableId);
        if (!state || !isAdminLoggedIn) return;
        state.element.innerHTML = state.currentHTML; 
        state.element.contentEditable = 'false';
        state.editButton.style.display = 'inline-block';
        state.saveButton.style.display = 'none';
        state.cancelButton.style.display = 'none';
    }

    // --- Slideshow Management Factory ---
    function createSlideshowManager(config: SlideshowManagerConfig) {
        let items: SlideshowItem[] = [];
        let slideIndex = 1;
        let slideTimeout: ReturnType<typeof setTimeout> | undefined;

        const container = document.getElementById(config.containerId) as HTMLDivElement;
        const dotsContainer = document.getElementById(config.dotsId) as HTMLDivElement;
        const adminList = document.getElementById(config.adminListId) as HTMLDivElement;
        const addForm = document.getElementById(config.addFormId) as HTMLFormElement;
        const fileInput = document.getElementById(config.fileInputId) as HTMLInputElement;
        const statusMessage = document.getElementById(config.statusMessageId) as HTMLDivElement;

        function save() {
            localStorage.setItem(config.storageKey, JSON.stringify(items));
        }

        function load() {
            const savedJSON = localStorage.getItem(config.storageKey);
            if (savedJSON) {
                try {
                    const parsed = JSON.parse(savedJSON);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        items = parsed;
                        return;
                    }
                } catch (e) {
                    console.error(`Failed to load slideshow from storage key "${config.storageKey}"`, e);
                }
            }
            items = config.defaultItems;
            save();
        }
        
        function render() {
            // Render public slideshow
            if (container && dotsContainer) {
                const prevArrow = container.querySelector('.prev');
                const nextArrow = container.querySelector('.next');
                container.innerHTML = '';
                if (prevArrow && nextArrow) {
                    container.append(prevArrow, nextArrow);
                }
                dotsContainer.innerHTML = '';

                if (items.length === 0) {
                    const p = document.createElement('p');
                    p.textContent = 'No slides to display.';
                    p.style.textAlign = 'center';
                    p.style.padding = '2rem';
                    container.insertBefore(p, prevArrow);
                } else {
                    items.forEach((item, index) => {
                        const slideDiv = document.createElement('div');
                        slideDiv.className = 'slide-item';
                        slideDiv.innerHTML = `<img src="${item.src}" alt="Slideshow image ${index + 1}">`;
                        container.insertBefore(slideDiv, prevArrow);
        
                        const dotSpan = document.createElement('span');
                        dotSpan.className = 'dot';
                        dotSpan.setAttribute('aria-label', `Go to slide ${index + 1}`);
                        dotSpan.addEventListener('click', () => currentSlide(index + 1));
                        dotsContainer.appendChild(dotSpan);
                    });
                }
            }
        
            // Render admin list
            if (adminList) {
                adminList.innerHTML = '';
                if (items.length === 0) {
                    adminList.innerHTML = '<p>No slides added yet.</p>';
                } else {
                    items.forEach(item => {
                        const entryDiv = document.createElement('div');
                        entryDiv.className = 'admin-slideshow-list-entry';
                        
                        const img = document.createElement('img');
                        img.src = item.src;
                        img.alt = 'Slide preview';
                        img.className = 'admin-slide-preview';
        
                        const idSpan = document.createElement('span');
                        idSpan.textContent = `...${item.id.slice(-12)}`;
                        idSpan.title = item.id;

                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Delete';
                        deleteButton.className = 'delete-slide-btn';
                        deleteButton.addEventListener('click', () => handleDelete(item.id));
        
                        entryDiv.append(img, idSpan, deleteButton);
                        adminList.appendChild(entryDiv);
                    });
                }
            }
        }

        function showSlides(n?: number) {
            if (n !== undefined) {
                slideIndex = n;
            }
            if (!container) return;
        
            const slides = container.querySelectorAll<HTMLElement>('.slide-item');
            const dots = dotsContainer?.querySelectorAll<HTMLElement>('.dot');
        
            if (slides.length === 0) return;
        
            if (slideIndex > slides.length) { slideIndex = 1; }
            if (slideIndex < 1) { slideIndex = slides.length; }
        
            slides.forEach(slide => slide.classList.remove('active-slide'));
            dots?.forEach(dot => dot.classList.remove('active'));
        
            slides[slideIndex - 1].classList.add('active-slide');
            if (dots) {
                dots[slideIndex - 1].classList.add('active');
            }
        
            clearTimeout(slideTimeout);
            slideTimeout = setTimeout(() => showSlides(slideIndex + 1), 5000);
        }

        function plusSlides(n: number) {
            showSlides(slideIndex + n);
        }
        
        function currentSlide(n: number) {
            showSlides(n);
        }

        function handleAdd(event: Event) {
            event.preventDefault();
            if (!isAdminLoggedIn || !fileInput.files || fileInput.files.length === 0) {
                showAdminStatusMessage(statusMessage, 'Please select an image file.', true);
                return;
            }
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    const newItem: SlideshowItem = {
                        id: `slide-${Date.now()}`,
                        src: e.target.result as string,
                    };
                    items.push(newItem);
                    save();
                    render();
                    showSlides(items.length);
                    showAdminStatusMessage(statusMessage, 'Slide added successfully!');
                    if (addForm) addForm.reset();
                }
            };
            reader.onerror = () => {
                 showAdminStatusMessage(statusMessage, 'Error reading file.', true);
            };
            reader.readAsDataURL(file);
        }

        function handleDelete(slideId: string) {
            if (!isAdminLoggedIn) return;
            items = items.filter(item => item.id !== slideId);
            save();
            render();
            if(slideIndex > items.length && items.length > 0) {
                slideIndex = items.length;
            } else if (items.length === 0) {
                slideIndex = 1;
            }
            showSlides(); 
            showAdminStatusMessage(statusMessage, 'Slide deleted.');
        }

        function init() {
            if (!container) return; // Don't initialize if the main container isn't on the page

            load();
            render();
            if (items.length > 0) {
                showSlides(slideIndex);
            }

            const prevArrow = container.querySelector<HTMLAnchorElement>('.prev');
            const nextArrow = container.querySelector<HTMLAnchorElement>('.next');
            if(prevArrow) prevArrow.addEventListener('click', () => plusSlides(-1));
            if(nextArrow) nextArrow.addEventListener('click', () => plusSlides(1));

            container.addEventListener('mouseenter', () => clearTimeout(slideTimeout));
            container.addEventListener('mouseleave', () => {
                clearTimeout(slideTimeout);
                slideTimeout = setTimeout(() => showSlides(slideIndex + 1), 5000);
            });
            
            if (addForm) {
                addForm.addEventListener('submit', handleAdd);
            }
        }

        return { init };
    }
    
    // --- Services Management ---
    function renderServices() {
        const gridsToUpdate = [servicesGridElement, homeServicesGridElement];
    
        gridsToUpdate.forEach(grid => {
            if (grid) {
                grid.innerHTML = '';
                if (serviceItems.length === 0) {
                    grid.innerHTML = '<p>No services are currently listed.</p>';
                } else {
                    serviceItems.forEach(item => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'service-item';
                        itemDiv.innerHTML = `
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                        `;
                        grid.appendChild(itemDiv);
                    });
                }
            }
        });
        
        // Render admin services list
        if (adminServicesListElement) {
            adminServicesListElement.innerHTML = '';
            if (serviceItems.length === 0) {
                adminServicesListElement.innerHTML = '<p>No services added yet.</p>';
            } else {
                serviceItems.forEach(item => {
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'admin-service-item-entry';
                    entryDiv.dataset.serviceId = item.id;

                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'service-content';
                    contentDiv.innerHTML = `
                        <h5>${item.title}</h5>
                        <p>${item.description}</p>
                    `;
                    
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'service-actions';
                    
                    const editButton = createEditControlButton('Edit', 'edit-service-btn', item.id);
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.className = 'delete-service-item-btn';
                    
                    actionsDiv.append(editButton, deleteButton);
                    entryDiv.append(contentDiv, actionsDiv);
                    adminServicesListElement.appendChild(entryDiv);

                    deleteButton.addEventListener('click', () => handleDeleteService(item.id));
                    editButton.addEventListener('click', () => startServiceEdit(item.id));
                });
            }
        }
    }

    function handleAddService(event: Event) {
        event.preventDefault();
        const title = serviceTitleInput.value.trim();
        const description = serviceDescriptionInput.value.trim();
        
        if (!title || !description) {
            showAdminStatusMessage(addServiceStatusMessage, 'Please enter both a title and description.', true);
            return;
        }

        const newService: ServiceItem = {
            id: `service-${Date.now()}`,
            title,
            description
        };

        serviceItems.push(newService);
        saveServices();
        renderServices();
        showAdminStatusMessage(addServiceStatusMessage, 'Service added successfully!');
        addServiceForm.reset();
    }

    function handleDeleteService(serviceId: string) {
        if (!isAdminLoggedIn) return;
        serviceItems = serviceItems.filter(item => item.id !== serviceId);
        saveServices();
        renderServices();
        showAdminStatusMessage(addServiceStatusMessage, 'Service deleted.');
    }
    
    function startServiceEdit(serviceId: string) {
        const item = serviceItems.find(s => s.id === serviceId);
        const entryDiv = adminServicesListElement.querySelector(`[data-service-id="${serviceId}"]`);
        if (!item || !entryDiv) return;

        const contentDiv = entryDiv.querySelector('.service-content') as HTMLDivElement;
        const actionsDiv = entryDiv.querySelector('.service-actions') as HTMLDivElement;
        
        contentDiv.innerHTML = `
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="edit-service-title" value="${item.title}">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="edit-service-desc" rows="4">${item.description}</textarea>
            </div>
        `;
        
        actionsDiv.innerHTML = '';
        const saveButton = createEditControlButton('Save', 'save-button', serviceId);
        const cancelButton = createEditControlButton('Cancel', 'cancel-button', serviceId);
        
        actionsDiv.append(saveButton, cancelButton);

        saveButton.addEventListener('click', () => saveServiceEdit(serviceId));
        cancelButton.addEventListener('click', () => renderServices()); // Just re-render to cancel
    }

    function saveServiceEdit(serviceId: string) {
        const entryDiv = adminServicesListElement.querySelector(`[data-service-id="${serviceId}"]`);
        if (!entryDiv) return;
        
        const newTitle = (entryDiv.querySelector('.edit-service-title') as HTMLInputElement).value.trim();
        const newDescription = (entryDiv.querySelector('.edit-service-desc') as HTMLTextAreaElement).value.trim();

        if (!newTitle || !newDescription) {
            showAdminStatusMessage(addServiceStatusMessage, 'Title and description cannot be empty.', true);
            return;
        }

        const itemIndex = serviceItems.findIndex(s => s.id === serviceId);
        if (itemIndex > -1) {
            serviceItems[itemIndex].title = newTitle;
            serviceItems[itemIndex].description = newDescription;
            saveServices();
            renderServices();
            showAdminStatusMessage(addServiceStatusMessage, 'Service updated successfully!');
        }
    }
    
    function initializeServices() {
        loadServices();
        renderServices();
        if (addServiceForm) {
            addServiceForm.addEventListener('submit', handleAddService);
        }
    }


    // --- Portfolio Management ---
    function renderPortfolioItems() {
        if (portfolioGridElement) {
            portfolioGridElement.innerHTML = ''; 
            if (portfolioItems.length === 0) {
                const placeholder = document.createElement('p');
                placeholder.textContent = 'No portfolio items yet. Add some from the admin panel!';
                placeholder.style.fontStyle = 'italic';
                placeholder.style.textAlign = 'center';
                 placeholder.style.gridColumn = '1 / -1'; // Span across all columns
                portfolioGridElement.appendChild(placeholder);
            } else {
                portfolioItems.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'portfolio-item';
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'portfolio-item-content';
                    contentDiv.innerHTML = `<h4>${item.title}</h4>`;
                    
                    const img = document.createElement('img');
                    img.src = item.imageSrc;
                    img.alt = item.title;
                    itemDiv.append(img, contentDiv);

                    portfolioGridElement.appendChild(itemDiv);
                });
            }
        }

        if (adminPortfolioItemsListElement) {
            adminPortfolioItemsListElement.innerHTML = ''; 
            if (portfolioItems.length === 0) {
                adminPortfolioItemsListElement.innerHTML = '<p>No portfolio items added yet.</p>';
            } else {
                portfolioItems.forEach(item => {
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'admin-portfolio-item-entry';
                    entryDiv.innerHTML = `
                        <img src="${item.imageSrc}" alt="${item.title} preview" class="admin-preview">
                        <span>${item.title}</span>
                        <button class="delete-portfolio-item-btn" data-item-id="${item.id}">Delete</button>
                    `;
                    adminPortfolioItemsListElement.appendChild(entryDiv);

                    const deleteButton = entryDiv.querySelector('.delete-portfolio-item-btn') as HTMLButtonElement;
                    deleteButton.addEventListener('click', () => handleDeletePortfolioItem(item.id));
                });
            }
        }
    }

    function handleAddPortfolioItem(event: Event) {
        event.preventDefault();
        if (!isAdminLoggedIn || !portfolioImageInput.files || portfolioImageInput.files.length === 0 || !portfolioTitleInput.value.trim()) {
            showAdminStatusMessage(addPortfolioStatusMessage, 'Please select an image and enter a title.', true);
            return;
        }

        const file = portfolioImageInput.files[0];
        const title = portfolioTitleInput.value.trim();
        const reader = new FileReader();

        reader.onload = (e) => {
            if (e.target?.result) {
                const newItem: PortfolioItem = {
                    id: `portfolio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    title: title,
                    imageSrc: e.target.result as string,
                };
                portfolioItems.push(newItem);
                savePortfolio();
                renderPortfolioItems();
                showAdminStatusMessage(addPortfolioStatusMessage, 'Portfolio item added successfully!');
                if (addPortfolioItemForm) addPortfolioItemForm.reset();
            }
        };
         reader.onerror = () => {
             showAdminStatusMessage(addPortfolioStatusMessage, 'Error reading image file.', true);
        };
        reader.readAsDataURL(file);
    }

    function handleDeletePortfolioItem(itemId: string) {
        if (!isAdminLoggedIn) return;
        portfolioItems = portfolioItems.filter(item => item.id !== itemId);
        savePortfolio();
        renderPortfolioItems();
        showAdminStatusMessage(addPortfolioStatusMessage, 'Portfolio item deleted.'); 
    }

    // --- Gallery Management ---
    function renderGallery() {
        if (galleryGridElement) {
            galleryGridElement.innerHTML = '';
            if (galleryItems.length === 0) {
                const placeholder = document.createElement('p');
                placeholder.textContent = 'No gallery items yet. Add some from the admin panel!';
                placeholder.style.fontStyle = 'italic';
                placeholder.style.textAlign = 'center';
                placeholder.style.gridColumn = '1 / -1';
                galleryGridElement.appendChild(placeholder);
            } else {
                galleryItems.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'gallery-item';
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'gallery-item-content';
                    contentDiv.innerHTML = `<h4>${item.title}</h4>`;

                    if (item.type === 'image') {
                        const img = document.createElement('img');
                        img.src = item.src;
                        img.alt = item.title;
                        img.addEventListener('click', () => openLightbox(item.src, item.title));
                        itemDiv.append(img, contentDiv);
                    } else { // video
                        itemDiv.classList.add('video-item');
                        const video = document.createElement('video');
                        video.controls = true;
                        video.preload = 'metadata';
                        const source = document.createElement('source');
                        source.src = item.src;
                        source.type = item.fileType;
                        video.appendChild(source);
                        itemDiv.append(video, contentDiv);
                    }
                    galleryGridElement.appendChild(itemDiv);
                });
            }
        }

        if (adminGalleryItemsListElement) {
            adminGalleryItemsListElement.innerHTML = '';
            if (galleryItems.length === 0) {
                adminGalleryItemsListElement.innerHTML = '<p>No gallery items added yet.</p>';
            } else {
                galleryItems.forEach(item => {
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'admin-gallery-item-entry';

                    let previewElement: HTMLImageElement | HTMLVideoElement;
                    if (item.type === 'image') {
                        previewElement = document.createElement('img');
                        previewElement.alt = `${item.title} preview`;
                    } else {
                        previewElement = document.createElement('video');
                        previewElement.muted = true; // Mute video previews in admin list
                    }
                    previewElement.src = item.src;
                    previewElement.className = 'admin-preview';

                    const titleSpan = document.createElement('span');
                    titleSpan.textContent = item.title;

                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'delete-gallery-item-btn';
                    deleteButton.textContent = 'Delete';
                    deleteButton.dataset.itemId = item.id;
                    deleteButton.addEventListener('click', () => handleDeleteGalleryItem(item.id));

                    entryDiv.append(previewElement, titleSpan, deleteButton);
                    adminGalleryItemsListElement.appendChild(entryDiv);
                });
            }
        }
    }

    function handleAddGalleryItem(event: Event) {
        event.preventDefault();
        if (!addGalleryItemForm) return; 
        const submitButton = addGalleryItemForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    
        if (!isAdminLoggedIn || !galleryFileInput.files || galleryFileInput.files.length === 0 || !galleryTitleInput.value.trim()) {
            showAdminStatusMessage(addGalleryStatusMessage, 'Please select a file and enter a title.', true);
            return;
        }
    
        const file = galleryFileInput.files[0];
        const title = galleryTitleInput.value.trim();
    
        const MAX_FILE_SIZE_MB = 50;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE_BYTES) {
            showAdminStatusMessage(addGalleryStatusMessage, `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`, true);
            if (addGalleryItemForm) addGalleryItemForm.reset(); 
            return;
        }
    
        const originalButtonText = submitButton ? submitButton.textContent : 'Add Gallery Item';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
        }
    
        const reader = new FileReader();
    
        reader.onload = (e) => {
            if (e.target?.result) {
                const fileSrc = e.target.result as string;
                const fileType = file.type;
                let itemType: 'image' | 'video' | null = null;
    
                if (fileType.startsWith('image/')) {
                    itemType = 'image';
                } else if (fileType.startsWith('video/')) {
                    itemType = 'video';
                }
    
                if (itemType) {
                    const newItem: GalleryItem = {
                        id: `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        title,
                        src: fileSrc,
                        type: itemType,
                        fileType
                    };
                    galleryItems.push(newItem);
                    saveGallery();
                    renderGallery();
                    showAdminStatusMessage(addGalleryStatusMessage, 'Gallery item added successfully!');
                    if (addGalleryItemForm) addGalleryItemForm.reset();
                } else {
                    showAdminStatusMessage(addGalleryStatusMessage, 'Unsupported file type.', true);
                }
            }
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        };
        reader.onerror = () => {
            showAdminStatusMessage(addGalleryStatusMessage, 'Error reading file.', true);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        };
        reader.readAsDataURL(file);
    }
    
    function handleDeleteGalleryItem(itemId: string) {
        if (!isAdminLoggedIn) return;
        galleryItems = galleryItems.filter(item => item.id !== itemId);
        saveGallery();
        renderGallery();
        showAdminStatusMessage(addGalleryStatusMessage, 'Gallery item deleted.');
    }

    function openLightbox(src: string, caption: string) {
        if (!lightbox || !lightboxImage || !lightboxCaption) return;
        lightboxImage.src = src;
        lightboxCaption.textContent = caption;
        lightbox.style.display = 'block';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.style.display = 'none';
    }

    function initializeGallery() {
        loadGallery();
        renderGallery();
        if (addGalleryItemForm) {
            addGalleryItemForm.addEventListener('submit', handleAddGalleryItem);
        }
        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeLightbox);
        }
        if(lightbox) {
            lightbox.addEventListener('click', (event) => {
                if (event.target === lightbox) {
                    closeLightbox();
                }
            });
        }
    }

    // --- Share Button ---
    function initializeSharing() {
        if (!shareButton) return;

        let isSharing = false;

        shareButton.addEventListener('click', async () => {
            if (isSharing) return;

            const siteTitle = siteSettingsConfig.get('siteTitle')?.currentValue || 'LOGAN\'S DESIGN';
            const taglineElement = editableElementsState.get('homeTagline');
            const taglineText = taglineElement ? taglineElement.currentHTML.replace(/<[^>]*>?/gm, '') : 'Creative Solutions, Beautifully Executed.';

            const shareData = {
                title: siteTitle,
                text: taglineText,
                url: window.location.origin,
            };

            isSharing = true;
            shareButton.disabled = true;

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(shareData.url);
                    alert('Link copied to clipboard!');
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            } finally {
                isSharing = false;
                shareButton.disabled = false;
            }
        });
    }

    // --- Social Sharing Links ---
    function initializeSocialShareLinks() {
        const container = document.getElementById('socialShareContainer');
        if (!container) return;
    
        const siteUrl = encodeURIComponent(window.location.origin);
        const shareLinks = container.querySelectorAll<HTMLAnchorElement>('a');
    
        shareLinks.forEach(link => {
            if (link.href.includes('YOUR_WEBSITE_URL')) {
                link.href = link.href.replace(/YOUR_WEBSITE_URL/g, siteUrl);
            }
        });
    }


    // --- Navigation & Page Setup ---
    function applyScroll(sectionId: string) {
        const headerHeight = headerElement?.offsetHeight || 0;
        const targetSectionElement = document.getElementById(sectionId);
        
        if (targetSectionElement) {
            const sectionTop = targetSectionElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20; 
            requestAnimationFrame(() => {
                window.scrollTo({ top: sectionTop, behavior: 'smooth' });
            });
        } else if (sectionId === 'home') {
             requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    function syncContentWithHash() {
        let currentHash = window.location.hash.substring(1); 
        const defaultSection = 'home';
        let sectionIdToActivate = defaultSection;

        if (currentHash === 'admin-dashboard' && !isAdminLoggedIn) {
            currentHash = 'admin-login'; 
            window.location.hash = 'admin-login'; 
        }
        if (currentHash === 'admin-login' && isAdminLoggedIn) {
            currentHash = 'admin-dashboard';
            window.location.hash = 'admin-dashboard';
        }

        if (currentHash) {
            const targetSectionElement = document.getElementById(currentHash);
            if (targetSectionElement && targetSectionElement.classList.contains('content-section')) {
                sectionIdToActivate = currentHash;
            } else {
                if (currentHash !== 'admin-login' && currentHash !== 'admin-dashboard') { 
                    sectionIdToActivate = defaultSection;
                } else {
                    sectionIdToActivate = currentHash; 
                }
            }
        }
        
        contentSections.forEach(section => {
            section.classList.toggle('active-section', section.id === sectionIdToActivate);
        });

        navLinks.forEach(link => {
            link.classList.toggle('active-link', link.getAttribute('data-section') === sectionIdToActivate);
        });
        
        if (adminLoginFooterLink) {
            adminLoginFooterLink.textContent = isAdminLoggedIn ? 'Admin Dashboard' : 'Admin Login';
            adminLoginFooterLink.setAttribute('href', isAdminLoggedIn ? '#admin-dashboard' : '#admin-login');
        }

        updateEditControlsVisibility(); 
        if(isAdminLoggedIn) { // Only load if admin is logged in and forms are relevant
             loadAdminFormFromState();
        }
       
        applyScroll(sectionIdToActivate);

        const expectedHash = `#${sectionIdToActivate}`;
        if (window.location.hash !== expectedHash && sectionIdToActivate) { 
            try {
                const baseUrlWithoutHash = window.location.href.split('#')[0];
                const newAbsoluteUrlWithCorrectHash = baseUrlWithoutHash + expectedHash;
                history.replaceState(null, '', newAbsoluteUrlWithCorrectHash);
            } catch (e) {
                console.error("Failed to correct hash using history.replaceState.", e);
            }
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                if (window.location.hash !== `#${sectionId}`) {
                    window.location.hash = sectionId;
                } else {
                    syncContentWithHash(); 
                }
            }
        });
    });

    window.addEventListener('popstate', syncContentWithHash);
    
    // --- Initializations ---

    // Create Slideshows
    const homeSlideshowManager = createSlideshowManager({
        containerId: 'slideshowContainer',
        dotsId: 'slideshowDotsContainer',
        adminListId: 'adminSlideshowList',
        addFormId: 'addSlideForm',
        fileInputId: 'slideImageInput',
        statusMessageId: 'addSlideStatusMessage',
        storageKey: LS_KEYS.SLIDESHOW,
        defaultItems: [
            { id: 'slide-default-1', src: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
            { id: 'slide-default-2', src: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
            { id: 'slide-default-3', src: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }
        ]
    });
    
    const portfolioSlideshowManager = createSlideshowManager({
        containerId: 'portfolioSlideshowContainer',
        dotsId: 'portfolioSlideshowDotsContainer',
        adminListId: 'adminPortfolioSlideshowList',
        addFormId: 'addPortfolioSlideForm',
        fileInputId: 'portfolioSlideImageInput',
        statusMessageId: 'addPortfolioSlideStatusMessage',
        storageKey: LS_KEYS.PORTFOLIO_SLIDESHOW,
        defaultItems: [
             { id: 'portfolio-slide-default-1', src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
             { id: 'portfolio-slide-default-2', src: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        ]
    });

    const aboutSlideshowManager = createSlideshowManager({
        containerId: 'aboutSlideshowContainer',
        dotsId: 'aboutSlideshowDotsContainer',
        adminListId: 'adminAboutSlideshowList',
        addFormId: 'addAboutSlideForm',
        fileInputId: 'aboutSlideImageInput',
        statusMessageId: 'addAboutSlideStatusMessage',
        storageKey: LS_KEYS.ABOUT_SLIDESHOW,
        defaultItems: [
             { id: 'about-slide-default-1', src: 'https://images.unsplash.com/photo-1522071820081-009f0129c7da?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
             { id: 'about-slide-default-2', src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        ]
    });

    homeSlideshowManager.init();
    portfolioSlideshowManager.init();
    aboutSlideshowManager.init();

    loadPortfolio();
    initializeEditableElements(); 
    initializeSiteSettings(); 
    initializeGallery();
    initializeServices();
    initializeSharing();
    initializeSocialShareLinks();
    initializeLogo();
    renderPortfolioItems();
    syncContentWithHash(); 

    // --- Form Submissions & Admin Logic ---
    if (quoteForm) {
        const quoteFormStatus = document.getElementById('quoteFormStatus') as HTMLDivElement;
        
        // Get form elements
        const nameInput = document.getElementById('name') as HTMLInputElement;
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const serviceSelect = document.getElementById('serviceType') as HTMLSelectElement;
        const messageTextarea = document.getElementById('message') as HTMLTextAreaElement;

        // Get error message elements
        const nameError = document.getElementById('nameError') as HTMLDivElement;
        const emailError = document.getElementById('emailError') as HTMLDivElement;
        const serviceError = document.getElementById('serviceError') as HTMLDivElement;
        const messageError = document.getElementById('messageError') as HTMLDivElement;

        const inputs = [nameInput, emailInput, serviceSelect, messageTextarea];
        const errorDivs = [nameError, emailError, serviceError, messageError];

        const validateEmail = (email: string): boolean => {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        };

        const validateForm = (): boolean => {
            let isValid = true;
            
            // Reset all errors first
            inputs.forEach(input => input.classList.remove('invalid'));
            errorDivs.forEach(div => {
                if(div) {
                    div.textContent = '';
                    div.style.display = 'none';
                }
            });
            if (quoteFormStatus) quoteFormStatus.classList.remove('visible');

            // Validate Name
            if (nameInput.value.trim() === '') {
                isValid = false;
                nameInput.classList.add('invalid');
                if (nameError) {
                    nameError.textContent = 'Full Name is required.';
                    nameError.style.display = 'block';
                }
            }

            // Validate Email
            if (emailInput.value.trim() === '') {
                isValid = false;
                emailInput.classList.add('invalid');
                if (emailError) {
                    emailError.textContent = 'Email Address is required.';
                    emailError.style.display = 'block';
                }
            } else if (!validateEmail(emailInput.value.trim())) {
                isValid = false;
                emailInput.classList.add('invalid');
                if (emailError) {
                    emailError.textContent = 'Please enter a valid email address.';
                    emailError.style.display = 'block';
                }
            }

            // Validate Service
            if (serviceSelect.value === '') {
                isValid = false;
                serviceSelect.classList.add('invalid');
                if (serviceError) {
                    serviceError.textContent = 'Please select a service.';
                    serviceError.style.display = 'block';
                }
            }

            // Validate Message
            if (messageTextarea.value.trim() === '') {
                isValid = false;
                messageTextarea.classList.add('invalid');
                if (messageError) {
                    messageError.textContent = 'Project Details are required.';
                    messageError.style.display = 'block';
                }
            }

            return isValid;
        };

        quoteForm.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!validateForm()) {
                if (quoteFormStatus) {
                    quoteFormStatus.innerHTML = 'Please correct the errors before submitting.';
                    quoteFormStatus.className = 'form-status-message visible';
                    quoteFormStatus.style.color = 'var(--error-color)';
                    quoteFormStatus.style.backgroundColor = '#fdd';
                    quoteFormStatus.style.borderColor = 'var(--error-color)';
                    setTimeout(() => {
                        quoteFormStatus.classList.remove('visible');
                        quoteFormStatus.style.color = '';
                        quoteFormStatus.style.backgroundColor = '';
                        quoteFormStatus.style.borderColor = '';
                    }, 5000);
                }
                return;
            }

            const formData = new FormData(quoteForm);
            const name = formData.get('name') as string;
            const service = formData.get('serviceType') as string;
            const message = formData.get('message') as string;

            const primaryEmail = siteSettingsConfig.get('contactEmail')?.currentValue;
            const secondaryEmail = siteSettingsConfig.get('contactEmailSecondary')?.currentValue;

            let recipientEmails: string[] = [];
            if (primaryEmail) recipientEmails.push(primaryEmail);
            if (secondaryEmail) recipientEmails.push(secondaryEmail);

            if (recipientEmails.length === 0) {
                if (quoteFormStatus) {
                    quoteFormStatus.innerHTML = 'Site contact email is not configured. Please contact the administrator.';
                    quoteFormStatus.className = 'form-status-message visible';
                    quoteFormStatus.style.color = 'var(--error-color)';
                    quoteFormStatus.style.backgroundColor = '#fdd';
                    quoteFormStatus.style.borderColor = 'var(--error-color)';
                }
                return;
            }

            const to = recipientEmails.join(',');
            const subject = `Quote Request from ${name} for ${service}`;
            const body = `
You have received a new quote request from the website.

--------------------------------
Name: ${name}
Email: ${emailInput.value}
Service of Interest: ${service}
--------------------------------

Message:
${message}
            `.trim().replace(/^\s+/gm, '');

            const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            if (quoteFormStatus) {
                quoteFormStatus.innerHTML = `
                    Thank you, ${name}! Your request has been prepared.
                    <br><br>
                    We are now attempting to open your default email client. Please review the details and click 'Send'.
                    <br><br>
                    If your email client does not open automatically, please 
                    <a href="${mailtoLink}" target="_blank">click here to compose the email</a>.
                `;
                quoteFormStatus.className = 'form-status-message visible';
                quoteFormStatus.style.color = 'var(--success-color)';
                quoteFormStatus.style.backgroundColor = '#e6ffed';
                quoteFormStatus.style.borderColor = 'var(--success-color)';
                
                // Trigger mailto link without navigating away
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = mailtoLink;
                document.body.appendChild(iframe);
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);

                quoteForm.reset();

                setTimeout(() => {
                    quoteFormStatus.classList.remove('visible');
                    quoteFormStatus.style.color = '';
                    quoteFormStatus.style.backgroundColor = '';
                    quoteFormStatus.style.borderColor = '';
                }, 15000);
            } else {
                alert(`Thank you, ${name}! Your email client should now open with the quote request details pre-filled. Please review and send the email to complete your request.`);
                window.location.href = mailtoLink;
                quoteForm.reset();
            }
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = adminUsernameInput.value;
            const password = adminPasswordInput.value;

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                isAdminLoggedIn = true;
                if (adminLoginError) {
                    adminLoginError.classList.remove('visible');
                    adminLoginError.textContent = '';
                }
                adminLoginForm.reset();
                loadAdminFormFromState(); 
                updateSiteDisplayFromState(); 
                window.location.hash = 'admin-dashboard'; 
            } else {
                isAdminLoggedIn = false;
                if (adminLoginError) {
                    adminLoginError.textContent = 'Invalid username or password. Please try again.';
                    adminLoginError.classList.add('visible');
                }
                updateEditControlsVisibility(); 
            }
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (event) => {
            event.preventDefault();
            const primaryEmail = siteSettingsConfig.get('contactEmail')?.currentValue;
            const primaryPhone = siteSettingsConfig.get('primaryPhone')?.currentValue;

            let message = 'Password reset must be done manually. Please contact the site administrator for assistance.\n\n';
            
            if (primaryEmail) {
                message += `Email: ${primaryEmail}\n`;
            }
            if (primaryPhone) {
                message += `Phone: ${primaryPhone}`;
            }
            if (!primaryEmail && !primaryPhone) {
                message = 'Password reset instructions are not available. Please contact support through other channels.'
            }
            alert(message);
        });
    }

    if (adminLogoutButton) {
        adminLogoutButton.addEventListener('click', () => {
            isAdminLoggedIn = false;
            if (adminUsernameInput) adminUsernameInput.value = ''; 
            if (adminPasswordInput) adminPasswordInput.value = '';
            window.location.hash = 'home'; 
        });
    }
    
    if (adminLoginFooterLink) {
        adminLoginFooterLink.addEventListener('click', (event) => {
            event.preventDefault();
            const targetHash = isAdminLoggedIn ? 'admin-dashboard' : 'admin-login';
             if (window.location.hash !== `#${targetHash}`) {
                window.location.hash = targetHash;
            } else {
                syncContentWithHash(); 
            }
        });
    }

    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', handleSaveSiteSettings);
    }

    if (addPortfolioItemForm) {
        addPortfolioItemForm.addEventListener('submit', handleAddPortfolioItem);
    }

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear().toString();
    }
});