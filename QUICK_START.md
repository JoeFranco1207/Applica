# Quick Start Guide - Create Profile Feature

## What Was Implemented

A complete "Create Profile" feature for the Applica platform with a professional design that allows users to:

1. **Click "Create" button** in the navbar after login
2. **Select their profile type** (Jobseeker or Employer) with beautiful card designs
3. **Fill in their profile information** with comprehensive forms
4. **Submit and complete setup** with proper validation and error handling

## Files Created

✅ `/frontend/src/pages/Create/ProfileSelection.jsx` - Role selection page
✅ `/frontend/src/pages/Create/CreateJobseekerProfile.jsx` - Jobseeker form
✅ `/frontend/src/pages/Create/CreateEmployerProfile.jsx` - Employer form

## Files Modified

✅ `/frontend/src/App.jsx` - Added state-based routing
✅ `/frontend/src/pages/Landing.jsx` - Added "Create" button to navbar
✅ `/frontend/src/pages/Signup.jsx` - Integrated Create workflow with authentication

## Key Features

### For Jobseekers
- Upload profile picture
- Add bio, experience, and education
- Upload resume/CV (required)
- Set location (region, city, barangay)
- Set citizenship status

### For Employers  
- Upload company logo
- Add company details (name, description, size, industry)
- Set company location
- Add website and contact information
- Set company establishment date

### Design Highlights
- 🎨 Professional blue color scheme (#2563eb, #3498db)
- 📱 Fully responsive design
- ✨ Smooth transitions and hover effects
- ✅ Form validation with error messages
- 🔄 Automatic navigation after successful submission
- 🛡️ Protected routes with authentication

## How to Use

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. User Flow
1. Login/Register on the Signup page
2. You're redirected to Landing page
3. Click the **"Create"** button in the navbar
4. Select **Jobseeker** or **Employer**
5. Fill in all required information (marked with *)
6. Upload profile picture and resume (if jobseeker)
7. Click **"Create Profile"**
8. Success message appears and you return to selection

### 3. Backend API Integration
- **Jobseeker Profile:** `PUT /api/jobseeker/profile`
- **Employer Profile:** `PUT /api/employer/profile`
- Both require Bearer token authentication
- Location data is sent as nested objects

## Form Field Mapping

### Jobseeker Form → Backend
```javascript
{
  bio: string,
  citizenShip: "Filipino" | "Foreign",
  location: {
    region: string,
    city: string,
    barangay: string,
    otherDetails: string
  },
  experience: string,
  education: string,
  profilePicture: file,
  resume: file (required)
}
```

### Employer Form → Backend
```javascript
{
  companyName: string,
  companyDescription: string,
  companyLocation: {
    region: string,
    city: string,
    barangay: string,
    otherDetails: string
  },
  companySize: string,
  industry: string,
  website: string,
  contactNumber: string,
  companyLogo: file,
  dateEstablished: date
}
```

## Navigation Flow

```
Landing Page
    ↓ (Click "Create" button)
ProfileSelection
    ↓ (Select role)
    ├→ CreateJobseekerProfile (if jobseeker)
    └→ CreateEmployerProfile (if employer)
        ↓ (Submit form)
        → ProfileSelection (back button navigates here)
        → Landing (continue button or click logo)
```

## Styling Details

All components use inline CSS styling for easy customization:
- `styles.container` - Main container styling
- `styles.navbar` - Navigation bar styling
- `styles.card` - Card components styling
- `styles.form` - Form styling
- `styles.input` - Input field styling

To customize colors, find the color values in each component:
- Primary: `#2563eb` (blue)
- Secondary: `#3498db` (light blue)
- Gray: `#ecf0f1`, `#7f8c8d`

## Important Notes

1. **Resume is Required** for jobseekers - the form won't submit without it
2. **Profile Picture is Optional** - but recommended
3. **Location fields are required** - region, city, barangay must be filled
4. **Company Name is Required** for employers
5. All file uploads use FormData for proper multipart/form-data handling
6. Authentication token must be present in localStorage

## Testing

To test the complete flow:
1. Create a new account via signup
2. Complete email verification
3. Click "Create" button
4. Select "Jobseeker" or "Employer"
5. Fill in the form with test data
6. Submit and verify success message
7. Navigate back using buttons to test flow

## Troubleshooting

### Form won't submit
- Check if all required fields (marked with *) are filled
- For jobseekers, ensure resume is uploaded
- Check browser console for error messages

### Navigation not working
- Ensure you're logged in (token in localStorage)
- Check browser console for routing errors
- Try clicking the logo to go back home

### Backend errors
- Ensure backend is running on port 8000
- Check if `/api/jobseeker/profile` and `/api/employer/profile` endpoints exist
- Verify Bearer token format in headers

## Next Steps (Optional Enhancements)

- Add image preview before upload
- Implement profile editing functionality
- Add progress indicators for form completion
- Implement file size validation
- Add date range picker for experience entries
- Add skill tags selection for jobseekers
- Add verification/approval workflow for employers
