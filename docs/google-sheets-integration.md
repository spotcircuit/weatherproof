# Google Sheets Integration for Survey Responses

## Overview
The WeatherProof survey submits responses to Google Sheets for easy analysis and follow-up. Here are three ways to set this up:

## Option 1: Google Apps Script (Recommended - Free)

### Step 1: Create Google Sheet
1. Create a new Google Sheet
2. Name it "WeatherProof Survey Responses"
3. Add these column headers in Row 1:
   - A: Timestamp
   - B: Qualified
   - C: Projects Per Year
   - D: Typical Delay Cost
   - E: Delays Last Year
   - F: Filed Claim
   - G: Role
   - H: Construction Types
   - I: Impacted Trades
   - J: Current Documentation
   - K: Biggest Challenges
   - L: Current Software
   - M: Valuable Features
   - N: Has Parametric Insurance
   - O: Magic Wand Fix
   - P: Wants Notification
   - Q: Company Name
   - R: Contact Name
   - S: Email
   - T: Phone
   - U: Preferred Contact
   - V: Interests

### Step 2: Create Google Apps Script
1. In your Google Sheet, go to Extensions → Apps Script
2. Replace the default code with:

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

3. Save the script (Ctrl+S or Cmd+S)
4. Click "Deploy" → "New Deployment"
5. Choose "Web app" as the type
6. Set:
   - Execute as: Me
   - Who has access: Anyone
7. Click "Deploy"
8. Copy the Web app URL (this is your webhook URL)

### Step 3: Add Webhook URL to Environment
Add to your `.env`:
```
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Option 2: Zapier Integration

1. Create a Zapier account
2. Create a new Zap:
   - Trigger: Webhooks by Zapier → Catch Hook
   - Action: Google Sheets → Create Spreadsheet Row
3. Map the fields from the webhook to your Google Sheet columns
4. Use the Zapier webhook URL in your `.env.local`

## Option 3: Make.com (formerly Integromat)

1. Create a Make.com account
2. Create a new scenario:
   - Trigger: Webhook
   - Action: Google Sheets → Add a Row
3. Map the JSON fields to sheet columns
4. Use the Make.com webhook URL in your `.env.local`

## Adding Automated Analysis

### Create Analysis Sheet
In your Google Sheet, create a second sheet called "Analysis" with:

1. **Qualification Rate**
   ```
   =COUNTIF(Responses!B:B,"TRUE")/COUNTA(Responses!B:B)
   ```

2. **Average Delay Cost Pivot**
   - Insert → Pivot table
   - Rows: Typical Delay Cost
   - Values: COUNT of Typical Delay Cost

3. **Top Features Requested**
   - Use SPLIT and COUNTIF formulas to analyze the comma-separated features

### Create Qualified Leads View
1. Create a third sheet "Qualified Leads"
2. Use FILTER formula:
   ```
   =FILTER(Responses!A:V, Responses!B:B=TRUE)
   ```

## Backup: Supabase Table (Optional)

If you want a backup in Supabase, create this table:

```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  qualified BOOLEAN,
  projects_per_year TEXT,
  typical_delay_cost TEXT,
  delays_last_year TEXT,
  filed_claim TEXT,
  role TEXT,
  construction_types TEXT[],
  impacted_trades TEXT[],
  current_documentation TEXT[],
  biggest_challenges JSONB,
  current_software TEXT,
  valuable_features TEXT[],
  has_parametric_insurance TEXT,
  magic_wand_fix TEXT,
  wants_notification TEXT,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  preferred_contact TEXT,
  interests TEXT[],
  submitted_at TIMESTAMPTZ
);
```

## Testing Your Integration

1. Visit `/survey` on your local development server
2. Fill out the form
3. Check your Google Sheet for the new row
4. Verify data formatting is correct

## Automated Follow-ups

You can set up automated emails using:
- Google Apps Script with time-based triggers
- Zapier with delay steps
- Make.com with scheduled scenarios

This will help you follow up with qualified leads automatically!