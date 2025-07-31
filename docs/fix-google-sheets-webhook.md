# Fix Google Sheets Webhook - Quick Guide

## The Problem
You're getting a 403 Forbidden error because you're using a Google Apps Script **library URL** instead of a **web app deployment URL**.

- Library URL (what you have): `https://script.google.com/macros/library/d/...`
- Web App URL (what you need): `https://script.google.com/macros/s/.../exec`

## Quick Fix Instructions

### Step 1: Open Your Google Apps Script
1. Go to your Google Sheet
2. Click **Extensions** → **Apps Script**
3. You should see your doPost function

### Step 2: Deploy as Web App (Not Library)
1. In the Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app** (NOT Library)
4. Configure:
   - Description: "WeatherProof Survey Webhook"
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**

### Step 3: Copy the Correct URL
After deployment, you'll get a URL like:
```
https://script.google.com/macros/s/AKfycbx_BOzrwknf-45z0n2P_DxcJ_BQMM3QbWpM3A1V0U6SF5X2VNSW24Vr3fZXQM49T_i4mA/exec
```

Notice it has `/s/` (not `/library/d/`) and ends with `/exec`

### Step 4: Update Your .env File
Replace the library URL in your `.env` file:
```
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

### Step 5: Test It
1. Restart your dev server: `npm run dev`
2. Fill out the survey at `/survey`
3. Check your Google Sheet for the new entry

## Your Current Google Apps Script Code
Your code is correct! Here it is for reference:

```javascript
function doPost(e) {
  try {
    // Parse the JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Prepare row data
    const row = [
      data.timestamp,
      data.qualified,
      data.projectsPerYear,
      data.typicalDelayCost,
      data.delaysLastYear,
      data.filedClaim,
      data.role,
      data.constructionTypes,
      data.impactedTrades,
      data.currentDocumentation,
      data.biggestChallenges,
      data.currentSoftware,
      data.valuableFeatures,
      data.hasParametricInsurance,
      data.magicWandFix,
      data.wantsNotification,
      data.companyName,
      data.contactName,
      data.email,
      data.phone,
      data.preferredContact,
      data.interests
    ];
    
    // Append the row
    sheet.appendRow(row);
    
    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Common Mistakes to Avoid
- ❌ Don't use "Publish" → "Deploy as library"
- ❌ Don't use the library URL format
- ✅ Use "Deploy" → "New deployment" → "Web app"
- ✅ Make sure "Who has access" is set to "Anyone"
- ✅ Use the deployment URL that ends with `/exec`

That's it! The 403 error will be fixed once you deploy as a web app instead of a library.