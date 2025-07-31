# WeatherProof Research Questionnaire Setup

## Google Forms Configuration

### Form Title: "WeatherProof Construction Research Survey"

### Form Description:
"Help shape the future of construction weather documentation. Your input will help us build the right solution for contractors like you. Takes only 5-10 minutes."

---

## SECTION 1: Quick Qualifier (Required)

### Q1: How many construction projects does your company manage annually?
- Type: Multiple choice
- Required: Yes
- Options:
  - 1-2 projects
  - 3-10 projects
  - 11-25 projects
  - 26-50 projects
  - 50+ projects

### Q2: What's the typical cost of a weather delay for your company?
- Type: Multiple choice
- Required: Yes
- Options:
  - Under $1,000
  - $1,000 - $5,000
  - $5,000 - $25,000
  - $25,000 - $100,000
  - Over $100,000

### Q3: How many weather-related delays did you experience in the last 12 months?
- Type: Multiple choice
- Required: Yes
- Options:
  - None
  - 1-5 delays
  - 6-15 delays
  - 16-30 delays
  - 30+ delays

### Q4: Have you ever filed a weather delay insurance claim or change order?
- Type: Multiple choice
- Required: Yes
- Options:
  - Yes, successfully
  - Yes, but it was denied/disputed
  - No, too much hassle
  - No, didn't know we could
  - No, not applicable to our work

### Q5: What's your role?
- Type: Multiple choice
- Required: Yes
- Options:
  - Owner/President
  - Project Manager
  - Superintendent
  - Estimator
  - Other

---

## SECTION 2: Detailed Discovery

### Q6: Types of construction (check all that apply)
- Type: Checkboxes
- Required: Yes
- Options:
  - Commercial buildings
  - Residential
  - Infrastructure/Heavy civil
  - Industrial
  - Specialty trade
  - Other

### Q7: Which trades are most impacted by weather delays?
- Type: Checkboxes
- Required: Yes
- Options:
  - Concrete/Foundation
  - Roofing
  - Framing
  - Earthwork/Excavation
  - Exterior finishes
  - Steel erection
  - Other

### Q8: How do you currently document weather?
- Type: Checkboxes
- Required: Yes
- Options:
  - Manual daily reports
  - Photos with phones
  - Third-party weather service
  - On-site weather station
  - No formal process

### Q9: Biggest challenge with weather claims (Rank 1-5)
- Type: Grid
- Required: Yes
- Rows:
  - Proving weather was "abnormal"
  - Meeting notice deadlines
  - Calculating actual costs
  - Getting insurance approval
  - Organizing documentation
- Columns: 1 (Biggest) to 5 (Smallest)

### Q10: Current construction management software
- Type: Multiple choice
- Required: Yes
- Options:
  - Procore
  - Autodesk Build
  - Buildertrend
  - CoConstruct
  - PlanGrid/Fieldwire
  - Spreadsheets
  - Other

### Q11: Which features would provide the most value? (Select top 5)
- Type: Checkboxes
- Required: Yes
- Validation: Maximum 5 selections
- Options:
  - Automatic weather monitoring
  - 21-day claim alerts
  - Cost impact calculations
  - ACORD form generation
  - Photo documentation
  - Digital signatures
  - Multi-site dashboard
  - Predictive weather alerts
  - Subcontractor delay tracking
  - Equipment idle time tracking

### Q12: Do you have parametric weather insurance?
- Type: Multiple choice
- Required: Yes
- Options:
  - Yes
  - No, but interested
  - No, not interested
  - What's parametric insurance?

### Q13: If you could wave a magic wand and fix ONE thing about weather delay documentation, what would it be?
- Type: Long answer text
- Required: No

---

## SECTION 3: Contact Information

### Q14: Would you like to be notified when WeatherProof launches?
- Type: Multiple choice
- Required: Yes
- Options:
  - Yes, I'm very interested
  - Maybe, send me updates
  - No thanks

### Conditional Section (Show if Q14 = Yes or Maybe)

### Q15: Company Name
- Type: Short answer
- Required: Yes (if shown)

### Q16: Your Name
- Type: Short answer
- Required: Yes (if shown)

### Q17: Email
- Type: Short answer
- Required: Yes (if shown)
- Validation: Email address

### Q18: Phone (Optional)
- Type: Short answer
- Required: No

### Q19: Best way to reach you
- Type: Multiple choice
- Required: Yes (if shown)
- Options:
  - Email
  - Phone call
  - Text message

### Q20: I'm interested in (check all that apply)
- Type: Checkboxes
- Required: No
- Options:
  - Monthly progress updates
  - Being a beta tester
  - Providing more detailed feedback
  - Early bird pricing

---

## Google Sheets Setup

### Sheet Name: "WeatherProof Research Responses"

### Automatic Columns Created by Google Forms:
1. Timestamp
2. Q1-Q20 responses

### Additional Sheets to Create:

#### Sheet 2: "Qualified Leads"
Filter: Responses where:
- Q1 ≥ "3-10 projects" AND
- Q2 ≥ "$1,000 - $5,000" AND
- Q3 ≥ "1-5 delays"

#### Sheet 3: "Analysis"
- Pivot tables for:
  - Most common challenges
  - Feature priorities
  - Software usage
  - Cost impact distribution

#### Sheet 4: "Follow-up Tracker"
Columns:
- Name
- Company
- Email
- Qualification Score
- Interested In
- Follow-up Date
- Notes
- Status

---

## Form Settings:

1. **Responses**
   - Collect email addresses: OFF (we ask manually)
   - Allow response editing: YES
   - Send respondents a copy: Optional

2. **Presentation**
   - Progress bar: ON
   - Shuffle question order: OFF
   - Show link to submit another response: YES

3. **Confirmation Message**
   "Thank you for your valuable input! Your responses will help shape WeatherProof to solve real contractor challenges. If you provided your email, we'll be in touch as development progresses."

---

## Promotion Strategy:

### Share Link Format:
`https://forms.gle/[YOUR-FORM-ID]`

### QR Code:
Generate QR code for trade shows/printed materials

### Embed Code:
For website/email campaigns

### Shortened URL:
Create branded short link: `weatherproof.app/survey`