# Admin Monitoring System & Resume Code Tracking

This document provides instructions for setting up the admin monitoring system and resume code tracking features.

## Features Implemented

1. **Resume Code Generation**: Each resume generation creates a unique 6-digit code
2. **Database Logging**: Codes are saved to MongoDB with username and timestamp
3. **User Display**: Resume code is displayed to users on the preview page
4. **Admin Dashboard**: Protected `/admin-monitor` route to view all generated codes
5. **Admin Login**: Secure login at `/admin-login` with preset credentials

## Setup Instructions

### 1. Install Dependencies

```bash
cd Backend
npm install
```

This will install:

- `mongoose` - MongoDB ODM
- `express-session` - Session management for admin authentication

### 2. Configure Environment Variables

Create a `.env` file in the `Backend` directory based on `env-template.txt`:

```bash
# Server Configuration
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/resume-tracker
# OR for production:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resume-tracker

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SESSION_SECRET=your-secret-key-change-in-production

# Environment Mode
NODE_ENV=development
```

### 3. Database Setup - MongoDB Atlas (Recommended)

#### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and create an account
3. Create a new project (e.g., "Resume Tracker")

#### Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose **M0 Free** tier (free forever)
3. Select a cloud provider and region closest to you
4. Click "Create Cluster"
5. Wait for cluster creation (2-3 minutes)

#### Step 3: Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Set authentication method to "Password"
4. Enter username (e.g., `resume_admin`) and generate a secure password
5. **Save the password** - you'll need it for the connection string
6. Under "Database User Privileges", select "Atlas admin" or "Read and write to any database"
7. Click "Add User"

#### Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" for development (or add specific IPs for production)
4. Click "Confirm"

#### Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name to the end: `...mongodb.net/resume-tracker?retryWrites=true&w=majority`

#### Step 6: Update Environment Variables

Edit `.env` file and paste your connection string:

```bash
MONGODB_URI=mongodb+srv://resume_admin:YOUR_PASSWORD@cluster0.abc123.mongodb.net/resume-tracker?retryWrites=true&w=majority
```

**Important Notes:**

- Replace `YOUR_PASSWORD` with the actual password you set
- Replace `cluster0.abc123` with your actual cluster address
- The database name `resume-tracker` will be created automatically on first connection

#### Alternative: Local MongoDB (Optional)

If you prefer to use local MongoDB:

1. Install MongoDB on your system
2. Start MongoDB service
3. Update `.env` to: `MONGODB_URI=mongodb://localhost:27017/resume-tracker`

### 4. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Usage

### For Students/Users

1. Fill out the resume form
2. Click "Generate Resume"
3. On the preview page, a 6-digit code will be displayed (e.g., "Your Resume Code: 123456")
4. Download the PDF
5. The code is stored in the database automatically

### For Admins

1. Navigate to `/admin-login`
2. Enter credentials:
   - Username: `admin` (default)
   - Password: `admin123` (default)
3. View the dashboard at `/admin-monitor`

#### Admin Dashboard Features

- **Total Resumes**: Shows count of all generated resumes
- **Today's Resumes**: Count of resumes generated today
- **Database Status**: Shows connection status
- **Resume Logs Table**:
  - Resume Code (6-digit)
  - Username
  - Date & Time

## API Endpoints

### Student/User Endpoints

- `POST /generate-pdf` - Generates PDF and returns resume code in headers
  - Headers: `X-Resume-Code: 123456`
  - Body: `{ html: "...", username: "John Doe" }`

### Admin Endpoints

- `GET /admin-login` - Login page
- `POST /api/admin-login` - Login authentication
  - Body: `{ username: "admin", password: "admin123" }`
- `GET /admin-monitor` - Dashboard (requires authentication)
- `GET /api/admin-logs` - Get logs as JSON (requires authentication)
- `GET /api/admin-logout` - Logout

## Database Schema

```javascript
ResumeLog {
  username: String,        // Student's name
  resumeCode: String,     // Unique 6-digit code
  createdAt: Date         // Timestamp
}
```

## Security Notes

⚠️ **Important**: Change default admin credentials in production!

1. Update `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
2. Use a strong `ADMIN_SESSION_SECRET`
3. Set `secure: true` in session cookie configuration for HTTPS
4. Consider implementing role-based access control for enhanced security

## Troubleshooting

### Database Connection Issues

- Check MongoDB is running: `mongosh` or `mongo`
- Verify connection string in `.env`
- Check firewall settings for Atlas

### Resume Code Not Displaying

- Check browser console for errors
- Verify session storage is enabled
- Check network tab for response headers

### Admin Login Not Working

- Check session is enabled
- Verify `express-session` is installed
- Check `.env` credentials match

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong admin credentials
3. Enable HTTPS and set `secure: true` in session config
4. Configure MongoDB Atlas with IP whitelisting
5. Set up proper CORS origins
6. Use environment variables for all secrets

## Monitoring Features

- View all generated resume codes
- Track daily generation counts
- Monitor database connection status
- Export data via JSON API endpoint

For questions or issues, check the console logs for detailed error messages.
