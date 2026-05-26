# Admin Login Setup Guide

## Firestore Database Structure

To use the admin login system, you need to create a collection in Firestore with the following structure:

### Collection: `admins`

Each document should use the user's Firebase Auth UID as the document ID.

#### Document Structure:
```javascript
{
  email: "admin@example.com",
  name: "Admin Name",
  role: "admin",
  status: "active",
  createdAt: timestamp,
  lastLogin: timestamp (optional)
}
```

### Field Descriptions:

- **email** (string): The admin's email address (should match Firebase Auth)
- **name** (string): Display name of the admin
- **role** (string): Must be "admin" for admin access
- **status** (string): "active" or "inactive" - only active admins can log in
- **createdAt** (timestamp): When the admin account was created
- **lastLogin** (timestamp, optional): Last successful login timestamp

## Setup Steps

### 1. Enable Email/Password Authentication in Firebase Console

1. Go to Firebase Console → Authentication
2. Click on "Sign-in method" tab
3. Enable "Email/Password" provider
4. Save changes

### 2. Create Admin Users

You have two options:

#### Option A: Using Firebase Console (Manual)

**Step 1: Create the user in Firebase Authentication**
1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Enter email (e.g., `admin@example.com`) and password
4. Click "Add user"
5. **Important:** Copy the generated UID (e.g., `abc123xyz456`) - you'll need this

**Step 2: Create the admin document in Firestore**
1. Go to Firestore Database
2. Click "Start collection"
3. Enter collection ID: `admins`
4. Click "Next"

**Step 3: Add the document with fields (YES, add each field one by one)**
1. Document ID: **Paste the UID you copied** (e.g., `abc123xyz456`)
2. Add fields by clicking "Add field" for each:
   
   **Field 1:**
   - Field name: `email`
   - Type: `string`
   - Value: `admin@example.com` (same as Auth email)
   
   **Field 2:**
   - Field name: `name`
   - Type: `string`
   - Value: `Admin Name` (any display name you want)
   
   **Field 3:**
   - Field name: `role`
   - Type: `string`
   - Value: `admin` (must be exactly "admin")
   
   **Field 4:**
   - Field name: `status`
   - Type: `string`
   - Value: `active` (must be exactly "active")
   
   **Field 5:**
   - Field name: `createdAt`
   - Type: `timestamp`
   - Value: Click the clock icon to set current timestamp

3. Click "Save"

**Done!** Your admin user is now ready to log in.

#### Option B: Using Firebase Admin SDK (Programmatic)

Create a Node.js script to add admins:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin(email, password, name) {
  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name
    });

    // Add admin document in Firestore
    await admin.firestore().collection('admins').doc(userRecord.uid).set({
      email: email,
      name: name,
      role: 'admin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Admin created successfully:', userRecord.uid);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

// Usage
createAdmin('admin@example.com', 'SecurePassword123', 'Admin Name');
```

### 3. Firestore Security Rules

Add these rules to protect your admin collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin collection - only authenticated admins can read their own data
    match /admins/{adminId} {
      allow read: if request.auth != null && request.auth.uid == adminId;
      allow write: if false; // Prevent client-side writes
    }
  }
}
```

## Testing the Login

1. Navigate to `/admin/login` in your application
2. Enter the admin email and password you created
3. Click "Sign In"
4. If successful, you'll be redirected to `/admin/dashboard`

## Troubleshooting

### "Access denied. Admin privileges required"
- The user exists in Firebase Auth but not in the Firestore `admins` collection
- Add the user to the `admins` collection with proper fields

### "Your account is inactive"
- The admin document has `status: "inactive"`
- Change the status to "active" in Firestore

### "Invalid email or password"
- Wrong credentials
- User doesn't exist in Firebase Auth
- Create the user in Firebase Authentication

## Security Best Practices

1. **Use Strong Passwords**: Require minimum 8 characters with mixed case, numbers, and symbols
2. **Enable MFA**: Consider adding multi-factor authentication
3. **Monitor Access**: Track login attempts and suspicious activity
4. **Regular Audits**: Review admin accounts periodically
5. **Least Privilege**: Only grant admin access when necessary
6. **Secure Rules**: Keep Firestore rules restrictive

## Next Steps

- Add password reset functionality
- Implement session timeout
- Add login activity logging
- Create admin management interface
- Add two-factor authentication
