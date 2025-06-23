// src/redux/slices/campaignSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  startDate: null,
  options: [],
  photos: [],
  highlights: '',
  about: '',
  finePrint: '',
  voucherInstructions: '',
  location: {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    appointmentRequired: false,
  },
  aboutBusiness: '',
  websiteLinks: [],
  businessType: '', // "sole_provider", etc.
  paymentInfo: {
    bankName: '',
    routingNumber: '',
    accountNumber: '',
  },
};

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    setStartDate: (state, action) => {
      state.startDate = action.payload;
    },
    setOptions: (state, action) => {
      state.options = action.payload;
    },
    setPhotos: (state, action) => {
      state.photos = action.payload;
    },
    setHighlights: (state, action) => {
      state.highlights = action.payload;
    },
    setAbout: (state, action) => {
      state.about = action.payload;
    },
    setFinePrint: (state, action) => {
      state.finePrint = action.payload;
    },
    setVoucherInstructions: (state, action) => {
      state.voucherInstructions = action.payload;
    },
    setLocation: (state, action) => {
      state.location = { ...state.location, ...action.payload };
    },
    setAboutBusiness: (state, action) => {
      state.aboutBusiness = action.payload;
    },
    addWebsiteLink: (state, action) => {
      state.websiteLinks.push(action.payload);
    },
    removeWebsiteLink: (state, action) => {
      state.websiteLinks = state.websiteLinks.filter((link, idx) => idx !== action.payload);
    },
    setBusinessType: (state, action) => {
      state.businessType = action.payload;
    },
    setPaymentInfo: (state, action) => {
      state.paymentInfo = { ...state.paymentInfo, ...action.payload };
    },
    resetCampaign: () => initialState,
  },
});

export const {
  setStartDate,
  setOptions,
  setPhotos,
  setHighlights,
  setAbout,
  setFinePrint,
  setVoucherInstructions,
  setLocation,
  setAboutBusiness,
  addWebsiteLink,
  removeWebsiteLink,
  setBusinessType,
  setPaymentInfo,
  resetCampaign,
} = campaignSlice.actions;

export default campaignSlice.reducer;
