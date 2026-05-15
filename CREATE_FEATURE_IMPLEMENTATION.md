# Applica - Create Profile Feature Implementation

## Overview
A professional "Create" profile feature has been added to the Applica platform, allowing users to:
1. Click a "Create" button in the navbar
2. Select between creating a Jobseeker or Employer profile
3. Fill in comprehensive profile information
4. Submit their profile to complete setup

## Files Created

### 1. **ProfileSelection.jsx** (`/frontend/src/pages/Create/`)
- Landing page for users to select profile type
- Features:
  - Two beautifully designed cards for selection
  - Visual feedback with checkmarks and hover effects
  - Clear description of each role
  - Benefits listed for each option
  - Professional color scheme with blue accents

### 2. **CreateJobseekerProfile.jsx** (`/frontend/src/pages/Create/`)
- Comprehensive form for job seekers to complete their profile
- Fields:
  - **Personal Information:**
    - Profile Picture upload
    - Bio/About Me
    - Work Experience
    - Education
    - Resume/CV (required)
  - **Location Information:**
    - Citizenship (Filipino/Foreign)
    - Region (dropdown)
    - City, Barangay, Other Details
- Form validation and error handling
- Success message on profile creation
- All location data is nested under `location` object for backend compatibility

### 3. **CreateEmployerProfile.jsx** (`/frontend/src/pages/Create/`)
- Comprehensive form for employers to complete their profile
- Fields:
  - **Company Information:**
    - Company Logo upload
    - Company Name (required)
    - Company Description
    - Company Size (1-10 to 1001+)
    - Industry (Technology, Finance, Healthcare, etc.)
    - Date Established
  - **Contact Information:**
    - Website URL
    - Contact Number
  - **Location Information:**
    - Region (dropdown)
    - City, Barangay, Other Details
- Form validation and error handling
- Success message on profile creation
- All location data is nested under `companyLocation` object for backend compatibility

## Files Updated

### 1. **App.jsx**
- Added state-based routing system
- Implemented navigation between pages
- Manages authentication state
- Routes:
  - `landing` - Main landing page
  - `create` - Profile selection
  - `createJobseeker` - Jobseeker form
  - `createEmployer` - Employer form

### 2. **Signup.jsx**
- Enhanced with state-based routing
- Supports the Create workflow after authentication
- Maintains all existing authentication logic
- Imports new Create components

### 3. **Landing.jsx**
- Added "Create" button to navbar
- Button navigates to profile selection
- Professional styling with gradient background
- Integrated with navigation system

## Design Features

### Professional Styling
- **Color Scheme:** Blues (#2563eb, #3498db) and grays
- **Typography:** Clean, modern fonts with proper hierarchy
- **Spacing:** Consistent padding and margins throughout
- **Responsive:** Mobile-friendly with adaptive layouts
- **Interactive Elements:**
  - Hover effects on cards and buttons
  - Smooth transitions
  - Visual feedback for selections
  - Disabled states for buttons

### User Experience
- Clear navigation flow
- Back buttons for easy navigation
- Form validation before submission
- Error and success messages
- Loading states during submission
- Automatic redirect after profile creation

## API Endpoints

### Jobseeker Profile
- **Method:** PUT
- **Endpoint:** `/api/jobseeker/profile`
- **Headers:** Authorization: Bearer {token}
- **Body:** FormData with profile fields

### Employer Profile
- **Method:** PUT
- **Endpoint:** `/api/employer/profile`
- **Headers:** Authorization: Bearer {token}
- **Body:** FormData with company fields

## Navigation Flow

1. User logs in via Signup
2. Landing page is displayed with "Create" button
3. User clicks "Create" button
4. ProfileSelection page shows two cards
5. User selects Jobseeker or Employer
6. Appropriate form is displayed
7. User fills in information and submits
8. Success message displayed and user redirected to ProfileSelection

## How to Use

### For Users
1. Log in to Applica
2. Click the "Create" button in the navbar
3. Select whether you're a Jobseeker or Employer
4. Fill in all required information
5. Click "Create Profile"
6. Confirmation message appears and you're returned to selection

### For Developers
- All components use inline styling (no external CSS files needed)
- State management is handled by React hooks
- Navigation is managed through a simple state-based router
- Components are self-contained and reusable
- Error handling is implemented throughout
- Form data is sent as FormData to support file uploads

## Notes
- All profile fields are optional except those marked with * (required)
- Resume upload can be added to the Jobseeker form in the future
- Profile pictures and logos are uploaded as FormData
- Changes can be made to styling through the `styles` objects in each component
