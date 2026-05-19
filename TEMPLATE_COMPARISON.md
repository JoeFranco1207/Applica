# Resume Templates - Quick Reference Comparison

## Template Comparison Matrix

| Feature | Classic Prof. | Creative Min. | Modern Tech | Executive | Academic | Creative Vibr. |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Font Family** | Sans-serif | Sans-serif | Sans-serif | Serif | Serif | Sans-serif |
| **Layout** | 2-col | 3-col header | Gradient | 2-col | 2-col | Gradient |
| **Profile Pic** | Circular | Rounded sq. | In header | In header | Not shown | In header |
| **Colors** | Flat | Flat | Gradient | Flat | Flat | Gradient |
| **Emojis** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Sidebar** | Light bg | Light bg | Gray bg | Light bg | Light bg | Gradient bg |
| **Border Style** | Bottom line | None | Left borders | Bottom line | Bottom line | Left borders |
| **Professional** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Modern** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Creative** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Typography Comparison

### Section Title Styling
```
Classic Professional:    UPPERCASE • 13px • Bold • Letter-spacing: 1.5px • Color accent
Creative Minimal:        UPPERCASE • 11px • Bold • Letter-spacing: 2px • Color accent  
Modern Tech:             UPPERCASE • 12px • Bold • Letter-spacing: 1px • White on accent
Executive Premium:       UPPERCASE • 11px • Bold • Letter-spacing: 3px • Color accent
Academic Scholar:        UPPERCASE • 13px • Bold • Letter-spacing: 1.5px • Color accent
Creative Vibrant:        UPPERCASE • 12px • Bold • Letter-spacing: 1.5px • White on accent
```

### Name/Header Sizing
```
Classic Professional:    32px • Font-weight: 700 • Letter-spacing: -0.5px
Creative Minimal:        36px • Font-weight: 300 • Letter-spacing: -1px
Modern Tech:             34px • Font-weight: 700 • Letter-spacing: 0px
Executive Premium:       38px • Font-weight: 700 • Letter-spacing: -0.5px
Academic Scholar:        32px • Font-weight: 700 • Letter-spacing: 0px
Creative Vibrant:        36px • Font-weight: 800 • Letter-spacing: -1px
```

---

## Layout & Spacing

### Container Padding
```
Classic Professional:    40px (all sides)
Creative Minimal:        Varies (header: 50px, body: 40px)
Modern Tech:             45px (all sides)
Executive Premium:       60px (all sides)
Academic Scholar:        45px (all sides)
Creative Vibrant:        50px (all sides)
```

### Column Gaps
```
Classic Professional:    30px
Creative Minimal:        40px
Modern Tech:             45px
Executive Premium:       50px
Academic Scholar:        40px
Creative Vibrant:        50px
```

### Section Margins
```
Classic Professional:    28px bottom
Creative Minimal:        35px bottom
Modern Tech:             40px bottom
Executive Premium:       45px bottom
Academic Scholar:        35px bottom
Creative Vibrant:        45px bottom
```

---

## Color Schemes

### Default Accent Color Adjustment
```
Classic Professional:    No gradient • Single color usage
Creative Minimal:        No gradient • Soft backgrounds
Modern Tech:             Gradient • adjustColor(color, 20%)
Executive Premium:       No gradient • Single color usage
Academic Scholar:        No gradient • Single color usage
Creative Vibrant:        Gradient • adjustColor(color, 15%) + adjustColor(color, 40%)
```

---

## Sidebar Information Display

### Classic Professional Sidebar
- Skills (badges with accent color)
- Contact (Email, Phone, Location)
- Additional (Citizenship)

### Creative Minimal Sidebar
- Skills (pill-style, light background)
- Information (Citizenship, Location)

### Modern Tech Sidebar
- Skills (rounded tags, accent color)
- Profile (Email, Phone, Location with labels)

### Executive Premium Sidebar
- Expertise (uppercase tags, accent color)
- Contact Information (labeled sections)

### Academic Scholar Sidebar
- Research Areas (grid layout, accent color)
- Contact (inline text style)

### Creative Vibrant Sidebar
- Skills (rounded chips, accent color)
- Info boxes (white cards with borders)

---

## Profile Information Handling

### All Templates Include:
- ✅ User name (firstName + middleName + lastName)
- ✅ Email address
- ✅ Phone number
- ✅ Location (combined from barangay, city, region)
- ✅ Bio/Summary
- ✅ Profile picture
- ✅ Citizenship
- ✅ Skills
- ✅ Experience
- ✅ Education

### Special Features by Template:
```
Modern Tech:    🎓 📋 💼 ⚡ emoji icons
Academic:       ▸ ▪ bullet point variations  
Creative Vibr:  🎨 📚 ⭐ emoji icons
```

---

## Responsive Design

All templates include media queries for tablets/mobile:
```css
@media (max-width: 800px) {
  /* Column layout changes to single column */
  /* Header flex-direction changes */
  /* Contact text alignment adjusts */
}
```

---

## Best Use Cases by Industry

### Classic Professional ✓
- Finance, Banking, Law
- Management Consulting
- Corporate HR, Admin
- Government positions
- Traditional industries

### Creative Minimal ✓
- UX/UI Designers
- Startups
- Creative Directors
- Tech companies
- Forward-thinking organizations

### Modern Tech ✓
- Software Developers
- Data Engineers
- DevOps Engineers
- Tech Startups
- IT Professionals

### Executive Premium ✓
- C-Suite Executives
- Board Members
- Senior Management
- Leadership positions
- High-level consulting

### Academic Scholar ✓
- University Professors
- Research Scientists
- PhD Candidates
- Academic Advisors
- Research Institutes

### Creative Vibrant ✓
- Graphic Designers
- Web Designers
- Artists & Illustrators
- Creative Agencies
- Marketing Professionals

---

## CSS Features by Template

| Feature | Used In |
|---------|---------|
| `border-radius` | All templates |
| `box-shadow` | Modern Tech, Creative Vibrant |
| `gradient` | Modern Tech, Creative Vibrant |
| `letter-spacing` | All templates |
| `font-weight` variations | All templates |
| `opacity` | Modern Tech, Creative Vibrant |
| `transition` | Modern Tech |
| `hover effects` | Modern Tech |
| `linear-gradient` | Modern Tech, Creative Vibrant |

---

## Font Loading & Performance

All templates use system fonts (no external font loading required):
- Inter (fallback: Segoe UI, Roboto)
- Garamond (fallback: Georgia, Times New Roman)
- Cambria (fallback: Garamond, Times New Roman)
- Roboto (fallback: Segoe UI, Helvetica)

This ensures:
- ✅ Fast PDF generation
- ✅ No font licensing issues
- ✅ Consistent rendering across systems
- ✅ Small file sizes

---

## Color Psychology & Recommendations

### Classic Professional (Blue #1e40af)
- Trust, professionalism, stability
- Corporate image
- Ideal for: Finance, Law, Corporate

### Creative Minimal (Teal #0f766e)
- Calm, modern, creative
- Fresh and contemporary
- Ideal for: Tech, Startups, Design

### Modern Tech (Indigo #6366f1)
- Innovation, technology, forward-thinking
- Modern aesthetic
- Ideal for: Tech, Engineering, IT

### Executive Premium (Purple #7c3aed)
- Sophistication, premium quality, leadership
- Elegant and exclusive
- Ideal for: C-Suite, Executive, Consulting

### Academic Scholar (Cyan #0891b2)
- Knowledge, research, intelligence
- Trustworthy and authoritative
- Ideal for: Academia, Research, Science

### Creative Vibrant (Red #dc2626)
- Energy, creativity, passion
- Bold and memorable
- Ideal for: Design, Creative, Marketing

---

## Implementation Quick Start

```javascript
// Example: Generate Modern Tech Resume
const resumeData = {
  template: 'modern-tech',
  color: '#6366f1',
  education: [
    'BS Computer Science, Tech University 2020',
    'Full Stack Developer Certification 2021'
  ],
  experience: [
    'Senior Full Stack Developer at TechCorp (2022-Present)',
    'Full Stack Developer at StartupXYZ (2021-2022)'
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Docker']
};

const pdf = await createResumeService(userId, resumeData);
// Returns: { fileName, filePath, publicUrl, pdfBuffer }
```

---

## Design Consistency Checklist

Before deploying templates:
- ✅ All fonts are system fonts (no external loading)
- ✅ Contrast ratios meet WCAG AA standards
- ✅ Line heights are between 1.6-1.9
- ✅ Letter-spacing is used strategically
- ✅ Whitespace is generous but not excessive
- ✅ Color hierarchy is clear
- ✅ Templates are visually distinct from each other
- ✅ All sections are properly styled
- ✅ Responsive design works on mobile
- ✅ PDFs render correctly across browsers

---

**Template System Version:** 2.0  
**Last Updated:** May 2024  
**Total Templates:** 6  
**Total Lines of Code:** ~2200  
