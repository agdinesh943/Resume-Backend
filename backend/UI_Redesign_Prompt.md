# Resume Maker Form - UI Design Prompt

## Overview

Create a modern, glassmorphism-themed resume form for Alliance University students. The form collects comprehensive student data for professional resume generation.

---

## Design Requirements

### Visual Theme

- **Style**: Glassmorphism with modern, elegant aesthetics
- **Background**: Gradient background (purple to blue) with animated particles
- **Form Container**: Frosted glass effect with backdrop blur
- **Color Palette**:
  - Primary: #1E2A5E (Dark blue)
  - Accent: #3b82f6 (Blue)
  - Success: #10b981 (Green)
  - Error: #ef4444 (Red)
- **Typography**: Inter, Segoe UI, sans-serif
- **Icons**: Ionicons library

---

## Form Sections

### 1. Personal Information Section

**Icon**: person  
**Fields**:

- Full Name (text, required) - `studentName`
- Profile Photo (file upload, required) - `profilePhoto`
  - Accept: image/\*
  - Note: "Profile Photo with White Background is mandatory"

---

### 2. Contact Information Section

**Icon**: call  
**Fields (all required)**:

- Personal Email (email) - `personalEmail`
- Official Email (email) - `officialEmail`
- Phone Number (tel) - `phone`
- LinkedIn Profile (url) - `linkedin`
- GitHub Profile (url) - `github`
- LeetCode Profile (url) - `leetcode`
- HackerRank Profile (url) - `hackerrank`

**Layout**: 2-column grid responsive

---

### 3. Education Section

**Icon**: school  
**Fields**:

#### Degree 1 (B.Tech) - Required

- Degree (dropdown, readonly: "B.Tech Computer Science and Engineering") - `degree1`
- Specialization (dropdown, required) - `specialization1`
  - Options: Cloud Computing, Cyber Security, Data Analytics, AI/ML, B.Tech AI/ML, Blockchain, Internet of Things
- Year of Graduation (text) - `year1`
- GPA/Percentage (text) - `gpa1`

#### Secondary Highschool - Required

- Degree (text, readonly: "12th Grade") - `degree2`
- Board of Education 1 (dropdown, required) - `university2`
  - Options: Central Board, Indian School Certificate, Open Schooling, State Boards (Andhra Pradesh, Telangana, Tamil Nadu, Karnataka, Kerala, Maharashtra, Gujarat, etc.) + "Other"
- Year of Passing (text) - `year2`
- Percentage (text) - `gpa2`
- College & city (text, optional) - `coll-city2`

#### Highschool - Required

- Degree (text, readonly: "10th Grade") - `degree3`
- Board of Education 2 (dropdown, required) - `university3`
  - Options: Same as Board of Education 1
- Year of Passing (text) - `year3`
- Percentage (text) - `gpa3`
- School & city (text, optional) - `coll-city3`

**Layout**: 2-column grid with separators between education levels

---

### 4. Technical Skills Section

**Icon**: code-slash  
**All fields required**:

#### Programming Languages - `programmingLanguages`

Multi-select from: C, C++, Java, Python, JavaScript, TypeScript, Go, Rust, C#, PHP, Swift, Kotlin

- Display as clickable tags/chips
- Visual feedback: Selected tags with blue background
- Hidden input to store comma-separated values

#### Web Technologies - `webTechnologies`

Multi-select from: HTML, CSS, JavaScript, React, Node.js, Express, Vue.js, Angular, Next.js, TypeScript, Redux, Tailwind CSS, Bootstrap, jQuery, Sass

#### Database Technologies - `databaseTechnologies`

Multi-select from: MySQL, MongoDB, PostgreSQL, SQLite, Oracle, Firebase, Redis, DynamoDB, Cassandra

#### Tools/Platforms - `toolsPlatforms`

Multi-select from: Git, GitHub, GitLab, Linux, VS Code, Docker, Kubernetes, Jenkins, CI/CD, Postman, REST API, GraphQL

#### Others - `others`

Single text input (required)

- Placeholder: "e.g., Microsoft Azure, AWS (Basics), Figma (UI/UX), Data Structures, OOPs"

**Layout**: Tag-based selection with hover effects

---

### 5. Academic Projects Section

**Icon**: flask  
**Minimum 3 projects required**

#### Project 1-3 (All Required)

Each project has:

- Project Title (text) - `projectTitle1/2/3`
- Technologies Used (text) - `projectTech1/2/3`
- Project Description (textarea, 10-30 words) - `projectDescription1/2/3`
  - Word counter display: "X/30 words"
  - Minimum 10 words, maximum 30 words
  - Color indicator: Red if <10, Black if valid

**Layout**: Grouped in cards with project number headers

---

### 6. Internships/Training Section

**Icon**: briefcase  
**All fields required**:

- Job Title (text) - `jobTitle`
- Company (text) - `company`
- Duration (text) - `duration`
- Job Description (textarea, 10-40 words) - `jobDescription`
  - Word counter display
  - Minimum 10 words, maximum 40 words

---

### 7. Certifications Section

**Icon**: trophy  
**Minimum 3 certifications required**

Each certification (5 total: 3 required, 2 optional):

- Certification Name (text) - `certName1-5`
- Platform/Issuer (text) - `certPlatform1-5`
- Checkbox: "Add Link" - `certLinkCheck1-5`
- Conditional URL field (appears only when checkbox checked) - `certLink1-5`
  - Optional URL input
  - Must start with "https://" if provided

**Layout**: Grouped in cards with number headers

---

### 8. Achievements & Participations Section

**Icon**: medal  
**Minimum 3 achievements required**

Each achievement (5 total: 3 required, 2 optional):

- Achievement/Participation text (text) - `achievement1-5`
- Checkbox: "Add Link" - `achievementLinkCheck1-5`
- Conditional URL field (appears only when checkbox checked) - `achievementLink1-5`
  - Optional URL input
  - Must start with "https://" if provided

**Layout**: Vertical list with optional links

---

### 9. Portfolio & Video Resume Section

**Icon**: phone-portrait  
**All fields required**:

- Portfolio QR Image (file upload, JPG/PNG) - `portfolioImage1`
- Video Resume QR Image (file upload, JPG/PNG) - `portfolioImage2`

---

### 10. Logo Images Section

**Icon**: business  
**Requirement**: Select exactly 4 logos

**Available logos (checkboxes, max 4)**:

- LeetCode - `logo_leetcode` (leetcode-logo.png)
- HackerRank - `logo_hackerrank` (hackerrank-logo.png)
- NPTEL - `logo_nptel` (nptel.png)
- Coursera - `logo_coursera` (Coursera.png)
- Oracle - `logo_oracle` (oracle.png)
- LinkedIn - `logo_linkedin_logo` (linkedin-logo.png)

**Features**:

- Grid layout with logo preview images (60x60px)
- Visual feedback on selection (blue border, checkmark)
- Note: "Please select 4 logos. Selected logos will appear in the resume header"

**Layout**: Responsive grid (3-4 columns on desktop, 2 on tablet, 1 on mobile)

---

## Interactive Features

### 1. Form Persistence

- Auto-save all text inputs to localStorage
- Restore on page reload
- Debounced saves (200ms delay)

### 2. Dynamic Word Counters

- Real-time word counting for descriptions
- Visual feedback (red if below minimum, black if valid)
- Auto-truncation if exceeding maximum

### 3. Technical Skills Selection

- Click to toggle selection state
- Visual feedback with color changes
- Selected skills saved to hidden inputs

### 4. Optional Link Fields

- Checkbox controls visibility of URL inputs
- Smooth slide-down animation
- Links validated to start with "https://"

### 5. Logo Selection

- Maximum 4 logos enforced
- Visual feedback with selection state
- Error message if less than 4 selected

### 6. Error Handling

- Comprehensive form validation
- Field-specific error messages
- Scroll to first error
- Error styling on invalid fields
- Success state transitions

---

## Validation Rules

### Required Fields

- All fields marked with \* are required
- File uploads: profile photo, 2 portfolio images
- Minimum counts: 3 projects, 3 certifications, 3 achievements
- Exactly 4 logos must be selected

### Word Count Requirements

- Project descriptions: 10-30 words
- Internship description: 10-40 words
- Real-time word counting and enforcement

### URL Validation

- All URL fields must start with "https://" if provided
- URLs are optional unless checkbox is checked

### File Upload Requirements

- Profile photo: Any image format
- Portfolio images: JPG/PNG only

---

## Styling Details

### Responsive Breakpoints

- Desktop: 1000px+ (2-column layout)
- Tablet: 768px-999px (1-2 column layout)
- Mobile: <768px (single column layout)

### Animations

- Slide-up animation on form load
- Hover effects on buttons and inputs
- Smooth transitions (0.3s ease)
- Backdrop blur effects
- Gradient backgrounds

### Interactive Elements

- Input focus states with blue glow
- Button hover states with lift effect
- Tag selection with color change
- Logo selection with border highlight
- Link field slide-down animation

---

## Submit Button

**Text**: "Generate Resume"  
**Icon**: rocket  
**Position**: Center of form actions  
**Style**: Green gradient button with shadow effects  
**Action**: Open resume preview in new tab

---

## Technical Implementation Notes

### Libraries Required

- Ionicons (v7.1.0) for icons
- html2pdf.js for PDF generation (loaded in preview page)

### File Structure

```
frontend/
├── resume-form.html
├── form-styles.css
├── form-script.js
├── images/
│   ├── logo.png
│   ├── leetcode-logo.png
│   ├── hackerrank-logo.png
│   ├── nptel.png
│   ├── Coursera.png
│   ├── oracle.png
│   ├── linkedin-logo.png
│   └── [other contact icons]
└── favicon/
    └── [favicon files]
```

### Form Data Structure

The form collects data for:

- Personal information
- Contact details (8 fields)
- Education (3 levels)
- Technical skills (5 categories)
- Projects (minimum 3)
- Internships
- Certifications (minimum 3)
- Achievements (minimum 3)
- Portfolio images
- Selected logos

All data is validated client-side before submission.

---

## Accessibility Requirements

- Semantic HTML structure
- ARIA labels for icons
- Keyboard navigation support
- Focus indicators
- Color contrast compliance
- Screen reader compatibility

---

This form should provide a smooth, modern user experience with comprehensive validation and feedback while maintaining the glassmorphism aesthetic throughout.
