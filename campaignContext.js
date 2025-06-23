import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
    DollarSign, Percent, Tag, Eye, Save, ArrowLeft, ArrowRight,
    CheckCircle, XCircle, AlertTriangle, Info, Loader2, Type, List, Scale, Gift, Settings,
    Home, Image, Star, Edit, FileText, BookOpen, Building, CheckSquare, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ALL_WIZARD_STEPS = [
    'category-selection',
    'service-selection',
    'services-added-confirmation',
    'template-selection',
    'deal-details',
	'promotion-type-selection', // NEW STEP ADDED HERE
    'photos',
    'highlights',
    'descriptions',
    'fine-print',
    'voucher-instructions',
    'business-info', // Renamed for consistency with internal validation structure
    'group-buy', // New step for group buy settings
    'review',
    'submit',
];

const CampaignContext = createContext();

export const useCampaign = () => {
    const context = useContext(CampaignContext);
    if (!context) {
        throw new Error('useCampaign must be used within a CampaignProvider');
    }
    return context;
};

export const CampaignProvider = ({ children }) => {
	const navigate = useNavigate();
    const [campaign, setCampaign] = useState({
        _id: null,
        name: '', // Internal campaign name, not directly mapped to DealSchema
        status: 'new', // 'new', 'draft', 'pending_review', 'published', 'archived'
        currentStep: ALL_WIZARD_STEPS[0],
        validationStatus: {
            category: 'incomplete',
            services: 'incomplete',
            options: 'incomplete',
            photos: 'incomplete', // Will map to 'media' validation
            highlights: 'incomplete',
            descriptions: 'incomplete',
            finePrint: 'incomplete',
            voucherInstructions: 'incomplete',
            // startDate: 'incomplete', // Removed as top-level, now derived or part of deal lifecycle
            overall: 'incomplete',
            dealDetails: { // Renamed from 'dealDetails' in schema to 'dealInfo' in context for clarity
                main: 'incomplete',
                title: 'incomplete',
                subtitle: 'incomplete',
                category: 'incomplete',
                isVirtual: 'incomplete',
                price: 'incomplete', // New: for single price deals
                originalPrice: 'incomplete', // New: for single price deals
                isGiftable: 'incomplete', // New
            },
            businessInfo: { // Renamed from 'businessinfo' (camelCase) to 'businessInfo'
                main: 'incomplete', // Overall status for business info section
                name: 'incomplete', // Merchant Name
                email: 'incomplete', // Merchant Email
                phone: 'incomplete', // Merchant Phone
                website: 'incomplete',
                description: 'incomplete', // Business Description (now just for frontend display?)
                type: 'incomplete', // Business Type (now stored on Merchant, but useful here for context)
                payment: 'incomplete',
                tax: 'incomplete',
                instagram: 'incomplete', // New
                facebook: 'incomplete', // New
            },
            groupBuy: { // New validation status for group buy
                main: 'incomplete',
                enabled: 'incomplete',
                minParticipants: 'incomplete',
                maxParticipants: 'incomplete',
                durationMinutes: 'incomplete',
            },
            seo: { // New validation section for SEO
                main: 'incomplete',
                metaDescription: 'incomplete',
                keywords: 'incomplete',
            },
			// NEW: Promotion object, conforming to your PromotionSchema structure
            promotion: {
                mechanism: null, // e.g., 'discount', 'buy_get_free'
                discountConfig: { type: 'percentage_off', value: 0, maxDiscountAmount: 0 },
                bogoConfig: {
                    buyQuantity: 1,
                    buyCondition: { appliesToType: 'all_eligible', products: [], categories: [], collections: [] },
                    getQuantity: 1,
                    getDiscountType: 'percentage_off',
                    getDiscountValue: 0,
                    getCondition: { appliesToType: 'all_eligible', products: [], categories: [], collections: [] },
                    maxGetsPerOrder: 0,
                },
                tieredDiscountConfig: { thresholdType: 'value', tiers: [], appliesTo: { appliesToType: 'all_eligible' } },
                giftWithPurchaseConfig: { giftProducts: [], quantityPerThreshold: 1 },
                creditPointsConfig: { pointsMultiplier: 0, fixedPoints: 0, pointsPerValue: 0 },
                // ... other promotion fields with sensible defaults
                name: '',
                description: '',
                code: '',
                autoApply: false,
                stackableWithAllOthers: false,
                priorityLevel: 50,
                startDate: new Date().toISOString(), // Example default
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // Example default
                minOrderValue: 0,
                minOrderQuantity: 0,
                appliesTo: { appliesToType: 'all_eligible' },
                currency: 'EUR', // Default currency
                maxUsesPerUser: 0,
                maxTotalUses: 0,
                // createdBy and updatedBy will be handled by the backend
            },
            review: 'incomplete',
            submit: 'incomplete', // Status for the submission process itself
        },
        selectedCategory: null,
        selectedServices: [], // Array of service objects (e.g., {id: '...', name: '...'})
        selectedTemplate: null,
        dealDetails: {
            title: '',
            subtitle: '', // Added to dealDetails
            category: '', // This will be sync'd with selectedCategory
            isVirtual: false,
            price: null, // New: For single price deals
            originalPrice: null, // New: For single price deals
            isGiftable: false, // New
        },
        targetingOptions: null, // Can be an object like { ageRange: '18-24', gender: 'female' }
        merchantInfo: { // New sub-object for merchant specific data
            name: '',
            email: '',
            phone: '',
            businessWebsite: [''], // Array of strings for multiple links
            businessDescription: '', // Can be kept here if you want a deal-specific business description
            businessType: '', // From previous context
            instagramURL: '', // New
            facebookURL: '', // New
        },
        voucherInstructions: {
            redemptionMethod: '',
            appointmentRequired: null, // Boolean
            contactMethod: '', // e.g., 'phone', 'email'
            contactValue: '', // The phone number or email address
            serviceArea: '', // e.g., 'local', 'national'
            businessLocations: [], // Array of structured location objects {address, city, state, zipCode, country, geo: {coordinates: []}}
            additionalInstructions: '', // New: For free text instructions
        },
        finePrint: {
            voucherLimit: 1,
            repurchaseDays: 30,
            validMonths: 3,
            singleUse: false,
            bookingLimit: false,
            bookingLimitValue: 1,
            validForNewCustomersOnly: false,
            ageRestriction: false,
            ageRestrictionValue: 18,
            otherRestrictions: '', // Free text, potentially markdown
        },
        paymentInfo: { // This data should ideally *not* be part of the campaign object for DB persistence. It belongs to the merchant profile.
            bankName: '',
            routingNumber: '',
            accountNumber: '',
            taxId: '', // e.g., EIN for businesses
            currency: 'EUR', // Assuming you're in Europe/Netherlands
        },
        options: [], // Array of option objects { id, name (formerly title), description, price, originalPrice, stock }
        templateApplied: false,
        media: [], // Renamed from 'photos' - Array of MediaItem objects { id (client-side), url, type, isPrimary, mediaId, title, description, tags, service }
        schedule: null, // For deal availability schedule (e.g., specific days/times)
        publishAt: null, // Campaign start date (often distinct from deal availability) - maps to DealSchema's publishAt
        expiresAt: null, // New: Explicit expiration date
        seo: { // New object for SEO fields
            metaDescription: '',
            keywords: [], // Array of strings
        },
        groupBuy: { // New: Group Buy specific configurations
            enabled: false,
            minParticipants: 2,
            maxParticipants: 10,
            durationMinutes: 60 * 24, // 24 hours
            autoJoin: true,
            autoLock: true,
            discountTiers: [],
            inviteBoostEnabled: false,
            inviteBoostSlots: 0,
            earlyAccessMinutes: 0,
            referralBoost: 0,
        },
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastSavedAt, setLastSavedAt] = useState(null);

    // --- Helper Functions to Update Specific Parts of the Campaign ---
    const updateCampaignData = useCallback((newData) => {
        setCampaign(prev => ({ ...prev, ...newData }));
    }, []);

    const updateValidationStatus = useCallback((section, status, subSection = null) => {
        setCampaign(prev => {
            const newValidationStatus = { ...prev.validationStatus };

            if (newValidationStatus[section] && typeof newValidationStatus[section] === 'object' && subSection) {
                // Handle nested validation like businessInfo.main
                const sectionObj = { ...newValidationStatus[section], [subSection]: status };
                // Determine overall status for the nested section based on its sub-sections
                const subSectionKeys = Object.keys(sectionObj).filter(s => s !== 'main');
                const allSubSectionsComplete = subSectionKeys.every(s => sectionObj[s] === 'complete');
                const anySubSectionError = subSectionKeys.some(s => sectionObj[s] === 'error');

                if (anySubSectionError) {
                    sectionObj.main = 'error';
                } else if (allSubSectionsComplete) {
                    sectionObj.main = 'complete';
                } else {
                    sectionObj.main = 'incomplete';
                }
                newValidationStatus[section] = sectionObj;
            } else {
                // Handle top-level validation (e.g., 'category', 'services')
                newValidationStatus[section] = status;
            }

            // --- Comprehensive Overall Validation Logic ---
            // This is crucial for the 'review' and 'submit' steps.
            const requiredSteps = ALL_WIZARD_STEPS.filter(step =>
                ![
                    'services-added-confirmation', // This is an in-flow confirmation, not a data step
                    'review', // Review step itself doesn't need to be complete for overall check
                    'submit' // Submit step is the final action, not a data entry step to validate
                ].includes(step)
            );

            const allMainSectionsComplete = requiredSteps.every(step => {
                let statusEntry;
                // Map wizard step names to validationStatus keys
                switch (step) {
                    case 'category-selection': statusEntry = newValidationStatus.category; break;
                    case 'service-selection': statusEntry = newValidationStatus.services; break;
                    case 'template-selection': statusEntry = newValidationStatus.template; break; // Assuming 'template' key if template is required
                    case 'deal-details': statusEntry = newValidationStatus.dealDetails.main; break;
					case 'promotion-type-selection': statusEntry = newValidationStatus.promotion; 
					break;
                    case 'photos': statusEntry = newValidationStatus.photos; break;
                    case 'highlights': statusEntry = newValidationStatus.highlights; break;
                    case 'descriptions': statusEntry = newValidationStatus.descriptions; break;
                    case 'fine-print': statusEntry = newValidationStatus.finePrint; break;
                    case 'voucher-instructions': statusEntry = newValidationStatus.voucherInstructions; break;
                    case 'business-info': statusEntry = newValidationStatus.businessInfo.main; break;
                    case 'group-buy': statusEntry = newValidationStatus.groupBuy.main; break; // Check group buy main status
                    // Add other top-level fields like SEO if they become directly required steps
                    default: return true; // Steps not directly mapped to validationStatus are considered complete by default
                }
                return statusEntry === 'complete';
            });

            newValidationStatus.overall = allMainSectionsComplete ? 'complete' : 'incomplete';

            return { ...prev, validationStatus: newValidationStatus };
        });
    }, []);


    // --- Campaign Lifecycle & Persistence Actions ---
    const createNewCampaign = useCallback(() => {
        setCampaign({
            _id: null,
            name: '',
            status: 'new',
            currentStep: ALL_WIZARD_STEPS[0],
            validationStatus: Object.fromEntries(
                Object.keys(campaign.validationStatus).map(key =>
                    typeof campaign.validationStatus[key] === 'object'
                        ? [key, Object.fromEntries(Object.keys(campaign.validationStatus[key]).map(subKey => [subKey, 'incomplete']))]
                        : [key, 'incomplete']
                )
            ),
            selectedCategory: null,
            selectedServices: [],
            selectedTemplate: null,
            dealDetails: {
                title: '', subtitle: '', category: '', isVirtual: false,
                price: null, originalPrice: null, isGiftable: false
            },
            targetingOptions: null,
            merchantInfo: {
                name: '', email: '', phone: '', businessWebsite: [''], businessDescription: '',
                businessType: '', instagramURL: '', facebookURL: ''
            },
            voucherInstructions: {
                redemptionMethod: '', appointmentRequired: null, contactMethod: '', contactValue: '',
                serviceArea: '', businessLocations: [], additionalInstructions: ''
            },
            finePrint: {
                voucherLimit: 1, repurchaseDays: 30, validMonths: 3, singleUse: false,
                bookingLimit: false, bookingLimitValue: 1, validForNewCustomersOnly: false,
                ageRestriction: false, ageRestrictionValue: 18, otherRestrictions: ''
            },
            paymentInfo: { bankName: '', routingNumber: '', accountNumber: '', taxId: '', currency: 'EUR' }, // Keep in context, but not for API submission
            options: [],
            templateApplied: false,
            media: [], // Renamed
            schedule: null,
            publishAt: null,
            expiresAt: null,
            seo: { metaDescription: '', keywords: [] },
            groupBuy: {
                enabled: false, minParticipants: 2, maxParticipants: 10, durationMinutes: 60 * 24,
                autoJoin: true, autoLock: true, discountTiers: [], inviteBoostEnabled: false,
                inviteBoostSlots: 0, earlyAccessMinutes: 0, referralBoost: 0,
            },
			promotion: { // Reset promotion field as well
                mechanism: null,
                discountConfig: { type: 'percentage_off', value: 0, maxDiscountAmount: 0 },
                bogoConfig: {},
                tieredDiscountConfig: {},
                giftWithPurchaseConfig: {},
                creditPointsConfig: {},
                name: '',
                description: '',
                code: '',
                autoApply: false,
                stackableWithAllOthers: false,
                priorityLevel: 50,
                startDate: new Date().toISOString(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                minOrderValue: 0,
                minOrderQuantity: 0,
                appliesTo: { appliesToType: 'all_eligible' },
                currency: 'EUR',
                maxUsesPerUser: 0,
                maxTotalUses: 0,
            },
        });
        navigate(`/onboarding/campaign-creation/${ALL_WIZARD_STEPS[0]}`);
    }, [navigate, campaign.validationStatus]);

    const loadCampaign = useCallback(async (campaignId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/campaigns/${campaignId}`);
            if (!response.ok) {
                throw new Error(`Error loading campaign: ${response.statusText}`);
            }
            const data = await response.json();

            // Transform backend data to match frontend context structure if necessary
            // For example, if backend locations only have geo, and frontend needs address components
            const transformedLocations = data.voucherInstructions?.businessLocations?.map(loc => ({
                // Assume backend returns address, city etc. if schema is updated
                ...loc,
                // Add default geo if missing or transform from string address if backend only returns that
                geo: loc.geo || { type: 'Point', coordinates: [0, 0] } // Placeholder, actual geocoding would happen on save
            })) || [];

            // Backend may have price/originalPrice directly, or options. Prioritize options for frontend if present.
            const campaignOptions = data.options && data.options.length > 0 ? data.options : [];
            const campaignPrice = data.options && data.options.length > 0 ? null : data.price;
            const campaignOriginalPrice = data.options && data.options.length > 0 ? null : data.originalPrice;

            setCampaign(prev => ({
                ...prev,
                ...data, // Spread direct top-level fields
                // Apply specific transformations/defaults for nested objects
                validationStatus: data.validationStatus || prev.validationStatus,
                dealDetails: {
                    ...prev.dealDetails,
                    ...data.dealDetails, // If dealDetails is a nested object in backend
                    title: data.title || '', // If title is top-level in backend but nested in context
                    subtitle: data.subtitle || '', // New subtitle
                    category: data.category || '',
                    isVirtual: typeof data.isVirtual === 'boolean' ? data.isVirtual : false,
                    price: campaignPrice,
                    originalPrice: campaignOriginalPrice,
                    isGiftable: typeof data.isGiftable === 'boolean' ? data.isGiftable : false,
                },
                merchantInfo: { // Map denormalized merchant info from backend to merchantInfo object
                    ...prev.merchantInfo,
                    name: data.merchantName || '',
                    email: data.merchantEmail || '',
                    phone: data.merchantPhone || '',
                    businessWebsite: data.businessWebsite ? [data.businessWebsite] : [''], // Backend stores as string, convert to array for frontend
                    instagramURL: data.instagramURL || '',
                    facebookURL: data.facebookURL || '',
                },
                voucherInstructions: {
                    ...prev.voucherInstructions,
                    ...data.voucherInstructions,
                    businessLocations: transformedLocations,
                },
                finePrint: {
                    ...prev.finePrint,
                    ...data.finePrint,
                },
				promotion: {
					...pre.promotion,
					...data.promotion,
				},
                // paymentInfo: data.paymentInfo || prev.paymentInfo, // Do NOT load sensitive payment info from backend into frontend state
                options: campaignOptions,
                media: data.media || prev.media, // Renamed from photos
                publishAt: data.publishAt ? new Date(data.publishAt) : null,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                seo: data.seo || { metaDescription: '', keywords: [] },
                groupBuy: {
                    ...prev.groupBuy,
                    ...data.groupBuy
                },
                // Ensure other top-level fields that are direct mapping are correctly set:
                selectedCategory: data.category || null,
                selectedServices: data.services ? data.services.map(s => ({ name: s, id: s })) : [], // Convert string array to object array
                highlights: data.highlights || [],
                descriptions: data.description || '', // Backend 'description' maps to frontend 'descriptions'
                businessDescription: data.merchantInfo?.businessDescription || '', // If you store it on merchant info
            }));
            setLastSavedAt(new Date());
        } catch (err) {
            console.error("Load campaign error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const prepareCampaignForSubmission = useCallback((currentCampaignState) => {
        const campaignToSend = { ...currentCampaignState };

        // 1. Core Deal Details (already structured)
        campaignToSend.title = campaignToSend.dealDetails.title;
        campaignToSend.subtitle = campaignToSend.dealDetails.subtitle;
        campaignToSend.category = campaignToSend.dealDetails.category;
        campaignToSend.isVirtual = campaignToSend.dealDetails.isVirtual;
        campaignToSend.isGiftable = campaignToSend.dealDetails.isGiftable;

        // Price / Options logic: Send either top-level price or options, but not both conflicting
        if (campaignToSend.options && campaignToSend.options.length > 0) {
            campaignToSend.price = undefined; // Ensure these are not sent if options are primary
            campaignToSend.originalPrice = undefined;
        } else {
            campaignToSend.price = campaignToSend.dealDetails.price;
            campaignToSend.originalPrice = campaignToSend.dealDetails.originalPrice;
        }

        // 2. Services: Map from object array to string array
        campaignToSend.services = campaignToSend.selectedServices.map(s => s.name);

        // 3. Media (formerly photos): Map from frontend structure to backend MediaItemSchema
        campaignToSend.media = campaignToSend.media.map(item => ({
            mediaId: item.mediaId,
            url: item.url,
            type: item.type,
            isPrimary: item.isPrimary,
            service: item.service || 'other', // Default service if not specified
            title: item.title || '',
            description: item.description || '',
            tags: item.tags || [],
            privacyStatus: item.privacyStatus || 'public',
        }));
		campaignToSend.promotion = campaignToSend.promotion.map(item => ({ 
                mechanism: item.mechanis, 
                discountConfig: item.discountConfig, 
                bogoConfig: item.bogoConfig, 
                tieredDiscountConfig: item.tieredDiscountConfig, 
                giftWithPurchaseConfig: item.giftWithPurchaseConfig,                 creditPointsConfig: item.creditPointsConfig,
                name: item.name,
                description: item.description,
                code: item.code,
                autoApply: item.autoApply,
                stackableWithAllOthers: item.stackableWithAllOthers,
                priorityLevel: item.priorityLevel,
                startDate: item.startDate,
                endDate: item.endDate,
                minOrderValue: item.minOrderValue,
                minOrderQuantity: item.minOrderQuantity,
                appliesTo: item.appliesTo,
                currency: item.currency,
                maxUsesPerUser: item.maxUsesPerUser,
                maxTotalUses: item.maxTotalUses,
            },
        // Set primaryImageUrl/VideoUrl explicitly from the media array
        const primaryImage = campaignToSend.media.find(m => m.type === 'image' && m.isPrimary);
        campaignToSend.primaryImageUrl = primaryImage ? primaryImage.url : undefined;
        const primaryVideo = campaignToSend.media.find(m => m.type === 'video' && m.isPrimary);
        campaignToSend.primaryVideoUrl = primaryVideo ? primaryVideo.url : undefined;

        // 4. Highlights, Description (already structured strings/arrays)
        campaignToSend.description = campaignToSend.descriptions; // Renamed for backend
        delete campaignToSend.descriptions; // Remove old name

        // 5. Fine Print & Voucher Instructions: Already aligned to structured objects
        // No explicit transformation needed here if backend schema matches frontend structure

        // 6. Merchant/Business Info (Denormalized)
        campaignToSend.merchantName = campaignToSend.merchantInfo.name;
        campaignToSend.merchantEmail = campaignToSend.merchantInfo.email;
        campaignToSend.merchantPhone = campaignToSend.merchantInfo.phone;
        campaignToSend.businessWebsite = campaignToSend.merchantInfo.businessWebsite[0] || ''; // Take first website from array
        campaignToSend.instagramURL = campaignToSend.merchantInfo.instagramURL;
        campaignToSend.facebookURL = campaignToSend.merchantInfo.facebookURL;
        // Business description and type can be handled at the merchant profile level if not specific to deal
        // If specific to deal, add fields to DealSchema

        // 7. Locations: Geocode if not already done, and clean up for submission
        campaignToSend.voucherInstructions.businessLocations = campaignToSend.voucherInstructions.businessLocations.map(loc => {
            // Placeholder for geocoding. In a real app, you'd call a geocoding API here
            // e.g., const geoCoords = await getCoordinates(loc.address, loc.city, loc.zipCode);
            // For now, ensure coordinates are present, even if dummy
            if (!loc.geo || !loc.geo.coordinates || loc.geo.coordinates.length !== 2) {
                // IMPORTANT: Replace with actual geocoding logic in production!
                console.warn("Geocoding not performed for location:", loc);
                loc.geo = { type: 'Point', coordinates: [0, 0] }; // Default to [lon, lat] 0,0
            }
            return loc;
        });

        // 8. Dates: Ensure `expiresAt` is calculated from `publishAt` and `validMonths` if not explicitly set
        if (campaignToSend.publishAt && campaignToSend.finePrint.validMonths) {
            const publishDate = new Date(campaignToSend.publishAt);
            const expiryDate = new Date(publishDate);
            expiryDate.setMonth(expiryDate.getMonth() + campaignToSend.finePrint.validMonths);
            campaignToSend.expiresAt = expiryDate.toISOString();
        } else if (!campaignToSend.expiresAt) {
            // Handle case where expiresAt is still missing (e.g., if publishAt or validMonths are missing)
            // You might throw an error or set a default
            console.error("ExpiresAt could not be calculated. Ensure publishAt and validMonths are set.");
            // For a robust app, ensure UI prevents submission or sets a sensible default/error
        }

        // 9. SEO fields
        campaignToSend.metaDescription = campaignToSend.seo.metaDescription;
        campaignToSend.keywords = campaignToSend.seo.keywords;

        // 10. Group Buy (already structured)
        // No explicit transformation needed if backend schema matches frontend structure

        // Clean up frontend-only state fields before sending
        delete campaignToSend.selectedCategory;
        delete campaignToSend.selectedServices; // Already mapped to `services` string array
        delete campaignToSend.selectedTemplate;
        delete campaignToSend.dealDetails; // Already mapped to top-level fields
        delete campaignToSend.validationStatus;
        delete campaignToSend.currentStep;
        delete campaignToSend.name; // Internal campaign name
        delete campaignToSend.paymentInfo; // Crucial: Payment info should NOT be part of deal submission
        delete campaignToSend.merchantInfo; // Already denormalized
        delete campaignToSend.seo; // Already mapped
        delete campaignToSend.templateApplied;
        delete campaignToSend.schedule;
		delete campaignToSend.promotion;


        return campaignToSend;
    }, []);

    const saveCampaignDraft = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const campaignDataToSend = prepareCampaignForSubmission(campaign);

            const method = campaign._id ? 'PUT' : 'POST';
            const url = campaign._id ? `/api/campaigns/${campaign._id}/draft` : '/api/campaigns/draft';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if needed
                },
                body: JSON.stringify(campaignDataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save campaign draft.');
            }

            const savedCampaign = await response.json();
            setCampaign(prev => ({
                ...prev,
                ...savedCampaign, // Update campaign with any server-generated fields like _id, timestamps
                status: 'draft', // Ensure status is 'draft' after saving as draft
                // Also, update the frontend's nested states from the savedCampaign if the backend sends them back structured
                dealDetails: {
                    ...prev.dealDetails,
                    title: savedCampaign.title || prev.dealDetails.title,
                    subtitle: savedCampaign.subtitle || prev.dealDetails.subtitle,
                    category: savedCampaign.category || prev.dealDetails.category,
                    isVirtual: typeof savedCampaign.isVirtual === 'boolean' ? savedCampaign.isVirtual : prev.dealDetails.isVirtual,
                    price: savedCampaign.price !== undefined ? savedCampaign.price : prev.dealDetails.price,
                    originalPrice: savedCampaign.originalPrice !== undefined ? savedCampaign.originalPrice : prev.dealDetails.originalPrice,
                    isGiftable: typeof savedCampaign.isGiftable === 'boolean' ? savedCampaign.isGiftable : prev.dealDetails.isGiftable,
                },
                selectedServices: savedCampaign.services ? savedCampaign.services.map(s => ({ name: s, id: s })) : prev.selectedServices,
                media: savedCampaign.media || prev.media,
                highlights: savedCampaign.highlights || prev.highlights,
                descriptions: savedCampaign.description || prev.descriptions,
                finePrint: savedCampaign.finePrint || prev.finePrint,
                voucherInstructions: savedCampaign.voucherInstructions || prev.voucherInstructions,
                merchantInfo: { // Re-populate merchantInfo from denormalized backend fields
                    ...prev.merchantInfo,
                    name: savedCampaign.merchantName || prev.merchantInfo.name,
                    email: savedCampaign.merchantEmail || prev.merchantInfo.email,
                    phone: savedCampaign.merchantPhone || prev.merchantInfo.phone,
                    businessWebsite: savedCampaign.businessWebsite ? [savedCampaign.businessWebsite] : prev.merchantInfo.businessWebsite,
                    instagramURL: savedCampaign.instagramURL || prev.merchantInfo.instagramURL,
                    facebookURL: savedCampaign.facebookURL || prev.merchantInfo.facebookURL,
                },
                publishAt: savedCampaign.publishAt ? new Date(savedCampaign.publishAt) : prev.publishAt,
                expiresAt: savedCampaign.expiresAt ? new Date(savedCampaign.expiresAt) : prev.expiresAt,
                seo: savedCampaign.seo || prev.seo,
                groupBuy: savedCampaign.groupBuy || prev.groupBuy,
                options: savedCampaign.options || prev.options,
            }));
            setLastSavedAt(new Date());
            updateValidationStatus('overall', campaign.validationStatus.overall);
            return { success: true, campaignId: savedCampaign._id };
        } catch (err) {
            console.error("Save draft error:", err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [campaign, updateValidationStatus, prepareCampaignForSubmission]);

    const publishCampaign = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (campaign.validationStatus.overall !== 'complete') {
                setError("Cannot submit: Please complete all required sections of the campaign.");
                updateValidationStatus('submit', 'error');
                return { success: false, error: "Validation incomplete" };
            }

            const campaignDataToSend = prepareCampaignForSubmission(campaign);

            const method = campaign._id ? 'PUT' : 'POST';
            const url = campaign._id ? `/api/campaigns/${campaign._id}/publish` : '/api/campaigns/publish';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if needed
                },
                body: JSON.stringify(campaignDataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to publish campaign.');
            }

            const publishedCampaign = await response.json();
            setCampaign(prev => ({
                ...prev,
                ...publishedCampaign,
                status: 'pending_review',
                dealDetails: {
                    ...prev.dealDetails,
                    title: publishedCampaign.title || prev.dealDetails.title,
                    subtitle: publishedCampaign.subtitle || prev.dealDetails.subtitle,
                    category: publishedCampaign.category || prev.dealDetails.category,
                    isVirtual: typeof publishedCampaign.isVirtual === 'boolean' ? publishedCampaign.isVirtual : prev.dealDetails.isVirtual,
                    price: publishedCampaign.price !== undefined ? publishedCampaign.price : prev.dealDetails.price,
                    originalPrice: publishedCampaign.originalPrice !== undefined ? publishedCampaign.originalPrice : prev.dealDetails.originalPrice,
                    isGiftable: typeof publishedCampaign.isGiftable === 'boolean' ? publishedCampaign.isGiftable : prev.dealDetails.isGiftable,
                },
                selectedServices: publishedCampaign.services ? publishedCampaign.services.map(s => ({ name: s, id: s })) : prev.selectedServices,
                media: publishedCampaign.media || prev.media,
                highlights: publishedCampaign.highlights || prev.highlights,
                descriptions: publishedCampaign.description || prev.descriptions,
                finePrint: publishedCampaign.finePrint || prev.finePrint,
                voucherInstructions: publishedCampaign.voucherInstructions || prev.voucherInstructions,
                merchantInfo: {
                    ...prev.merchantInfo,
                    name: publishedCampaign.merchantName || prev.merchantInfo.name,
                    email: publishedCampaign.merchantEmail || prev.merchantInfo.email,
                    phone: publishedCampaign.merchantPhone || prev.merchantInfo.phone,
                    businessWebsite: publishedCampaign.businessWebsite ? [publishedCampaign.businessWebsite] : prev.merchantInfo.businessWebsite,
                    instagramURL: publishedCampaign.instagramURL || prev.merchantInfo.instagramURL,
                    facebookURL: publishedCampaign.facebookURL || prev.merchantInfo.facebookURL,
                },
                publishAt: publishedCampaign.publishAt ? new Date(publishedCampaign.publishAt) : prev.publishAt,
                expiresAt: publishedCampaign.expiresAt ? new Date(publishedCampaign.expiresAt) : prev.expiresAt,
                seo: publishedCampaign.seo || prev.seo,
                groupBuy: publishedCampaign.groupBuy || prev.groupBuy,
                options: publishedCampaign.options || prev.options,
            }));
            updateValidationStatus('submit', 'complete');
            setLastSavedAt(new Date());
            navigate('/merchant/campaigns');
            return { success: true, campaignId: publishedCampaign._id };
        } catch (err) {
            console.error("Publish campaign error:", err);
            setError(err.message);
            updateValidationStatus('submit', 'error');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [campaign, navigate, updateValidationStatus, prepareCampaignForSubmission]);


    // --- Helper Functions to Update Specific Parts of the Campaign ---

    const setSelectedCategory = useCallback((category) => {
        setCampaign(prev => ({
            ...prev,
            selectedCategory: category,
            dealDetails: { ...prev.dealDetails, category: category } // Keep in sync
        }));
        updateValidationStatus('category', category ? 'complete' : 'incomplete');
        updateValidationStatus('dealDetails', category ? 'complete' : 'incomplete', 'category');
    }, [updateValidationStatus]);

    const setSelectedServices = useCallback((services) => {
        updateCampaignData({ selectedServices: services });
        updateValidationStatus('services', services && services.length > 0 ? 'complete' : 'incomplete');
    }, [updateCampaignData, updateValidationStatus]);

    const setSelectedTemplate = useCallback((template) => {
        updateCampaignData({ selectedTemplate: template });
        updateValidationStatus('template', template ? 'complete' : 'incomplete');
    }, [updateCampaignData, updateValidationStatus]);

    const updateOption = useCallback((optionId, updatedFields) => {
        setCampaign(prevCampaign => {
            const updatedOptions = prevCampaign.options.map(option =>
                option.id === optionId ? { ...option, ...updatedFields } : option // Use client-side 'id' for updates
            );
            // Validation for options
            const isValid = updatedOptions.length > 0 && updatedOptions.every(opt => opt.name && opt.price > 0 && typeof opt.stock === 'number' && opt.stock >= 0);
            updateValidationStatus('options', isValid ? 'complete' : 'incomplete');
            return { ...prevCampaign, options: updatedOptions };
        });
    }, [updateValidationStatus]);

    const removeOption = useCallback((optionId) => {
        setCampaign(prevCampaign => {
            const filteredOptions = prevCampaign.options.filter(option => option.id !== optionId);
            const isValid = filteredOptions.length > 0 && filteredOptions.every(opt => opt.name && opt.price > 0 && typeof opt.stock === 'number' && opt.stock >= 0);
            updateValidationStatus('options', isValid ? 'complete' : 'incomplete');
            return { ...prevCampaign, options: filteredOptions };
        });
    }, [updateValidationStatus]);

    const setOptions = useCallback((optionsData) => {
        updateCampaignData({ options: optionsData });
        const isValid = optionsData.length > 0 && optionsData.every(opt => opt.name && opt.price > 0 && typeof opt.stock === 'number' && opt.stock >= 0);
        updateValidationStatus('options', isValid ? 'complete' : 'incomplete');
    }, [updateCampaignData, updateValidationStatus]);

    // Renamed from setPhotos
    const setMedia = useCallback((mediaData) => {
        updateCampaignData({ media: mediaData });
        const isValid = mediaData.length > 0 && mediaData.some(item => item.type === 'image' && item.url);
        updateValidationStatus('photos', isValid ? 'complete' : 'incomplete'); // Using 'photos' key for now
    }, [updateCampaignData, updateValidationStatus]);

    const setDealDetails = useCallback((details) => {
        setCampaign(prev => ({
            ...prev,
            dealDetails: { ...prev.dealDetails, ...details }
        }));

        const currentDetails = { ...campaign.dealDetails, ...details }; // Use updated values for validation
        const isValidTitle = currentDetails.title && currentDetails.title.trim().length > 0;
        const isValidSubtitle = currentDetails.subtitle && currentDetails.subtitle.trim().length > 0;
        const isValidCategory = currentDetails.category && currentDetails.category.trim().length > 0;
        const isValidVirtual = typeof currentDetails.isVirtual === 'boolean';
        const isValidIsGiftable = typeof currentDetails.isGiftable === 'boolean';

        // Check if options are present, if not, validate price/originalPrice
        let isValidPrice = true;
        let isValidOriginalPrice = true;
        if (!campaign.options || campaign.options.length === 0) {
            isValidPrice = typeof currentDetails.price === 'number' && currentDetails.price >= 0;
            isValidOriginalPrice = typeof currentDetails.originalPrice === 'number' && currentDetails.originalPrice >= 0;
        }

        updateValidationStatus('dealDetails', isValidTitle ? 'complete' : 'incomplete', 'title');
        updateValidationStatus('dealDetails', isValidSubtitle ? 'complete' : 'incomplete', 'subtitle');
        updateValidationStatus('dealDetails', isValidCategory ? 'complete' : 'incomplete', 'category');
        updateValidationStatus('dealDetails', isValidVirtual ? 'complete' : 'incomplete', 'isVirtual');
        updateValidationStatus('dealDetails', isValidPrice ? 'complete' : 'incomplete', 'price');
        updateValidationStatus('dealDetails', isValidOriginalPrice ? 'complete' : 'incomplete', 'originalPrice');
        updateValidationStatus('dealDetails', isValidIsGiftable ? 'complete' : 'incomplete', 'isGiftable');
    }, [updateValidationStatus, campaign.options, campaign.dealDetails]); // Added campaign.options to dependencies

    const setTargetingOptions = useCallback((options) => {
        updateCampaignData({ targetingOptions: options });
        // Add validation for targeting options if needed, e.g., if options object is not empty
    }, [updateCampaignData]);

    const setSchedule = useCallback((scheduleData) => {
        updateCampaignData({ schedule: scheduleData });
        // Add validation for schedule if needed
    }, [updateCampaignData]);

    const updateDescriptions = useCallback((newDescriptionsContent) => {
        setCampaign(prev => ({
            ...prev,
            descriptions: newDescriptionsContent
        }));
        updateValidationStatus('descriptions', newDescriptionsContent && newDescriptionsContent.trim().length > 0 ? 'complete' : 'incomplete');
    }, [updateValidationStatus]);

    const setCurrentStep = useCallback((stepName) => {
        setCampaign(prev => ({ ...prev, currentStep: stepName }));
    }, []);

    const updateMerchantInfo = useCallback((newData) => {
        setCampaign(prev => ({
            ...prev,
            merchantInfo: { ...prev.merchantInfo, ...newData }
        }));
        // Granular validation for merchantInfo
        const currentInfo = { ...campaign.merchantInfo, ...newData };

        const isValidName = currentInfo.name && currentInfo.name.trim().length > 0;
        const isValidEmail = currentInfo.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentInfo.email);
        const isValidPhone = currentInfo.phone && currentInfo.phone.trim().length > 0;
        const isValidWebsite = currentInfo.businessWebsite && currentInfo.businessWebsite.some(link => link.trim() !== '');
        // businessDescription and type are now mostly for merchant profile, not deal specific, but can validate if needed
        const isValidInstagram = !currentInfo.instagramURL || currentInfo.instagramURL.trim().length > 0; // Optional but if present, valid
        const isValidFacebook = !currentInfo.facebookURL || currentInfo.facebookURL.trim().length > 0; // Optional but if present, valid

        updateValidationStatus('businessInfo', isValidName ? 'complete' : 'incomplete', 'name');
        updateValidationStatus('businessInfo', isValidEmail ? 'complete' : 'incomplete', 'email');
        updateValidationStatus('businessInfo', isValidPhone ? 'complete' : 'incomplete', 'phone');
        updateValidationStatus('businessInfo', isValidWebsite ? 'complete' : 'incomplete', 'website');
        updateValidationStatus('businessInfo', isValidInstagram ? 'complete' : 'incomplete', 'instagram');
        updateValidationStatus('businessInfo', isValidFacebook ? 'complete' : 'incomplete', 'facebook');
    }, [updateValidationStatus, campaign.merchantInfo]);

    const updateFinePrint = useCallback((newFinePrintData) => {
        setCampaign(prev => ({
            ...prev,
            finePrint: { ...prev.finePrint, ...newFinePrintData }
        }));
        // More robust validation for finePrint. Example: check specific required fields.
        const currentFinePrint = { ...campaign.finePrint, ...newFinePrintData };
        const isValid = currentFinePrint.voucherLimit > 0 && currentFinePrint.validMonths > 0;
        updateValidationStatus('finePrint', isValid ? 'complete' : 'incomplete');
    }, [updateValidationStatus, campaign.finePrint]);

    const updateHighlights = useCallback((newHighlightsContent) => {
        setCampaign(prev => ({
            ...prev,
            highlights: newHighlightsContent
        }));
        updateValidationStatus('highlights', newHighlightsContent && newHighlightsContent.length > 0 && newHighlightsContent.every(h => h.trim().length > 0) ? 'complete' : 'incomplete');
    }, [updateValidationStatus]);

    // Renamed from addPhoto
    const addMediaItem = useCallback((mediaItemData) => {
        setCampaign(prev => {
            const updatedMedia = [...prev.media, mediaItemData];
            const isValid = updatedMedia.length > 0 && updatedMedia.some(item => item.type === 'image' && item.url);
            updateValidationStatus('photos', isValid ? 'complete' : 'incomplete');
            return { ...prev, media: updatedMedia };
        });
    }, [updateValidationStatus]);

    // Renamed from removePhoto
    const removeMediaItem = useCallback((mediaItemId) => {
        setCampaign(prev => {
            const updatedMedia = prev.media.filter(p => p.id !== mediaItemId); // Use client-side 'id' for removal
            const isValid = updatedMedia.length > 0 && updatedMedia.some(item => item.type === 'image' && item.url);
            updateValidationStatus('photos', isValid ? 'complete' : 'incomplete');
            return { ...prev, media: updatedMedia };
        });
    }, [updateValidationStatus]);

    // Renamed from setPrimaryPhoto
    const setPrimaryMediaItem = useCallback((mediaItemId) => {
        setCampaign(prev => ({
            ...prev,
            media: prev.media.map(p => ({
                ...p,
                isPrimary: p.id === mediaItemId
            }))
        }));
    }, []);

    const updateVoucherInstructions = useCallback((newData) => {
        setCampaign(prev => ({
            ...prev,
            voucherInstructions: {
                ...prev.voucherInstructions,
                ...newData
            }
        }));
        const currentInstructions = { ...campaign.voucherInstructions, ...newData };
        const isValidRedemption = currentInstructions.redemptionMethod && currentInstructions.redemptionMethod.trim().length > 0;
        const isValidContact = (currentInstructions.contactMethod && currentInstructions.contactValue && currentInstructions.contactValue.trim().length > 0) ||
                                (currentInstructions.businessLocations && currentInstructions.businessLocations.length > 0);
        // Location validation: ensure each location has at least address, city, zipCode, country and geo coordinates
        const areLocationsValid = currentInstructions.businessLocations.every(loc =>
            loc.address && loc.address.trim().length > 0 &&
            loc.city && loc.city.trim().length > 0 &&
            loc.zipCode && loc.zipCode.trim().length > 0 &&
            loc.country && loc.country.trim().length > 0 &&
            loc.geo && loc.geo.coordinates && loc.geo.coordinates.length === 2
        );

        updateValidationStatus('voucherInstructions', (isValidRedemption && isValidContact && areLocationsValid) ? 'complete' : 'incomplete');
    }, [updateValidationStatus, campaign.voucherInstructions]);

    const updatePaymentInfo = useCallback((newPaymentInfo) => {
        setCampaign(prev => ({
            ...prev,
            paymentInfo: newPaymentInfo
        }));
        // Example: Validate bankName, accountNumber, routingNumber
        const isValid = newPaymentInfo && newPaymentInfo.bankName && newPaymentInfo.accountNumber && newPaymentInfo.routingNumber;
        updateValidationStatus('businessInfo', isValid ? 'complete' : 'incomplete', 'payment'); // Assuming payment is a sub-section of businessInfo
    }, [updateValidationStatus]);

    // Added for tax info within businessInfo
    const updateTaxInfo = useCallback((newTaxInfo) => {
        setCampaign(prev => ({
            ...prev,
            paymentInfo: { ...prev.paymentInfo, taxId: newTaxInfo.taxId } // Assuming taxId is part of paymentInfo
        }));
        const isValid = newTaxInfo && newTaxInfo.taxId && newTaxInfo.taxId.trim().length > 0;
        updateValidationStatus('businessInfo', isValid ? 'complete' : 'incomplete', 'tax');
    }, [updateValidationStatus]);

    const updatePublishAt = useCallback((dateIsoString) => { // Renamed from updateStartDate
        setCampaign(prev => {
            const updatedCampaign = { ...prev, publishAt: dateIsoString };
            // Calculate expiresAt whenever publishAt or validMonths changes
            if (dateIsoString && updatedCampaign.finePrint.validMonths) {
                const publishDate = new Date(dateIsoString);
                const expiryDate = new Date(publishDate);
                expiryDate.setMonth(expiryDate.getMonth() + updatedCampaign.finePrint.validMonths);
                updatedCampaign.expiresAt = expiryDate.toISOString();
            } else {
                updatedCampaign.expiresAt = null; // Clear if not calculable
            }
            return updatedCampaign;
        });
        updateValidationStatus('dealDetails', dateIsoString ? 'complete' : 'incomplete', 'publishAt'); // Add this to dealDetails validation or a new step
    }, [updateValidationStatus]);

    const updateSEO = useCallback((newSEOData) => {
        setCampaign(prev => ({
            ...prev,
            seo: { ...prev.seo, ...newSEOData }
        }));
        const currentSEO = { ...campaign.seo, ...newSEOData };
        const isValidMetaDescription = currentSEO.metaDescription && currentSEO.metaDescription.trim().length > 0;
        const isValidKeywords = currentSEO.keywords && currentSEO.keywords.length > 0 && currentSEO.keywords.every(k => k.trim().length > 0);

        updateValidationStatus('seo', isValidMetaDescription ? 'complete' : 'incomplete', 'metaDescription');
        updateValidationStatus('seo', isValidKeywords ? 'complete' : 'incomplete', 'keywords');
    }, [updateValidationStatus, campaign.seo]);

    const updateGroupBuy = useCallback((newGroupBuyData) => {
        setCampaign(prev => ({
            ...prev,
            groupBuy: { ...prev.groupBuy, ...newGroupBuyData }
        }));
        const currentGroupBuy = { ...campaign.groupBuy, ...newGroupBuyData };
        let isValidMain = 'incomplete';
        if (currentGroupBuy.enabled) {
            const isValidMin = currentGroupBuy.minParticipants >= 2;
            const isValidMax = currentGroupBuy.maxParticipants >= currentGroupBuy.minParticipants;
            const isValidDuration = currentGroupBuy.durationMinutes > 0;
            if (isValidMin && isValidMax && isValidDuration) {
                isValidMain = 'complete';
            } else {
                isValidMain = 'incomplete'; // Or 'error' depending on how strict you want to be
            }
        } else {
            isValidMain = 'complete'; // If disabled, it's considered complete
        }

        updateValidationStatus('groupBuy', isValidMain, 'main'); // Update main status
        updateValidationStatus('groupBuy', currentGroupBuy.enabled ? 'complete' : 'incomplete', 'enabled');
        updateValidationStatus('groupBuy', currentGroupBuy.minParticipants >= 2 ? 'complete' : 'incomplete', 'minParticipants');
        updateValidationStatus('groupBuy', currentGroupBuy.maxParticipants >= currentGroupBuy.minParticipants ? 'complete' : 'incomplete', 'maxParticipants');
        updateValidationStatus('groupBuy', currentGroupBuy.durationMinutes > 0 ? 'complete' : 'incomplete', 'durationMinutes');

    }, [updateValidationStatus, campaign.groupBuy]);


    // NEW: Navigation functions for the wizard
    const goToNextStep = useCallback((currentStepName) => {
        const currentIdx = ALL_WIZARD_STEPS.indexOf(currentStepName);
        if (currentIdx < ALL_WIZARD_STEPS.length - 1) {
            const nextStepName = ALL_WIZARD_STEPS[currentIdx + 1];
            setCurrentStep(nextStepName);
            navigate(`/onboarding/campaign-creation/${nextStepName}`);
        }
    }, [navigate, setCurrentStep]);

    const goToPreviousStep = useCallback((currentStepName) => {
        const currentIdx = ALL_WIZARD_STEPS.indexOf(currentStepName);
        if (currentIdx > 0) {
            const previousStepName = ALL_WIZARD_STEPS[currentIdx - 1];
            setCurrentStep(previousStepName);
            navigate(`/onboarding/campaign-creation/${previousStepName}`);
        }
    }, [navigate, setCurrentStep]);

    // --- EFFECT for loading existing campaign if ID is present in URL ---
    useEffect(() => {
        // This effect would typically be triggered by a route parameter
        // For example, if your route is /onboarding/campaign-creation/:campaignId
        // you would use useParams from react-router-dom here.
        // const { campaignId } = useParams();
        // if (campaignId && campaign._id !== campaignId) {
        //   loadCampaign(campaignId);
        // }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    // Context Value
    const contextValue = {
        campaign,
        loading,
        error,
        lastSavedAt,
        createNewCampaign,
        loadCampaign,
        saveCampaignDraft,
        publishCampaign,
        updateCampaignData,
        setSelectedCategory,
        setSelectedServices,
        setSelectedTemplate,
        updateDescriptions,
        updateHighlights,
        updateFinePrint,
        updateVoucherInstructions,
        updatePaymentInfo,
        updateTaxInfo,
        setDealDetails,
        setTargetingOptions,
        setOptions,
        setMedia, // Renamed
        setSchedule,
        updateMerchantInfo, // Combined businessWebsite, description, type, social links
        removeOption,
        updateValidationStatus,
        addMediaItem, // Renamed
        removeMediaItem, // Renamed
        setPrimaryMediaItem, // Renamed
        updatePublishAt, // Renamed
        updateSEO, // New
        updateGroupBuy, // New
        goToNextStep,
        goToPreviousStep,
        ALL_WIZARD_STEPS,
    };

    return (
        <CampaignContext.Provider value={contextValue}>
            {children}
        </CampaignContext.Provider>
    );
};
