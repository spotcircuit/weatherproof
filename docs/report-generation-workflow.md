# Report Generation Workflow Design

## User Scenarios & Report Types

### 1. **Emergency Claim** (Most Common)
**Scenario**: "Yesterday's storm shut down our roofing work. I need to document this for insurance NOW."
- User needs: Quick documentation, automatic weather verification
- Timeline: Same day or next day
- Key data: Weather conditions, crew affected, immediate costs

### 2. **Monthly Summary**
**Scenario**: "I need to submit all weather delays from March to my insurance company"
- User needs: Aggregated data, professional formatting
- Timeline: End of month
- Key data: All delays, total costs, weather patterns

### 3. **Project Completion Report**
**Scenario**: "Project is done, need to claim all weather delays for the entire job"
- User needs: Comprehensive documentation, schedule impact analysis
- Timeline: Project end
- Key data: Critical path impacts, total delays, cost breakdown

### 4. **Active Delay Documentation**
**Scenario**: "It's currently storming and work is stopped. I want to start documenting NOW"
- User needs: Real-time tracking, photo uploads, crew tracking
- Timeline: During the event
- Key data: Live weather, photos, safety decisions

## Simplified Report Flow

### Step 1: Report Intent (What do you need?)
```
┌─────────────────────────────────────────┐
│         What do you need today?         │
├─────────────────────────────────────────┤
│                                         │
│  [🚨] Document Current Delay            │
│       "Work stopped due to weather"     │
│                                         │
│  [📄] Generate Insurance Claim          │
│       "Create formal claim document"    │
│                                         │
│  [📊] Monthly Summary                   │
│       "All delays for a period"        │
│                                         │
│  [✓] Project Final Report              │
│       "Complete project documentation"  │
│                                         │
└─────────────────────────────────────────┘
```

### Step 2: Smart Data Collection

#### For "Document Current Delay":
```
┌─────────────────────────────────────────┐
│     Quick Delay Documentation           │
├─────────────────────────────────────────┤
│                                         │
│ Project: [Dropdown - Active Projects]   │
│                                         │
│ What happened?                          │
│ ○ Rain/Snow    ○ High Winds           │
│ ○ Lightning    ○ Temperature           │
│ ○ Multiple Conditions                   │
│                                         │
│ [📸 Take/Upload Photos]                 │
│                                         │
│ Crew Affected: [Smart Default: 12]     │
│                                         │
│ [🌦️ Fetch Current Weather]             │
│ ▼ Austin, TX - 2.3 mi from site       │
│   Wind: 32 mph ⚠️ (exceeds 25 mph)    │
│   Rain: 1.2" (exceeds 0.5")           │
│   Temp: 42°F                           │
│                                         │
│ [Start Tracking] [Save & Close]         │
└─────────────────────────────────────────┘
```

#### For "Generate Insurance Claim":
```
┌─────────────────────────────────────────┐
│      Insurance Claim Wizard             │
├─────────────────────────────────────────┤
│                                         │
│ 1. Select Delays to Include:            │
│                                         │
│ ☑ Mar 15 - High Winds (8 hrs) $2,400  │
│ ☑ Mar 18 - Heavy Rain (6 hrs) $1,800  │
│ ☐ Mar 22 - Cold Temp (4 hrs) $1,200   │
│                                         │
│ 2. Verify Information:                  │
│ Policy #: [CPP-789456___]              │
│ Contract #: [2024-ABC-123]             │
│                                         │
│ 3. Additional Documentation:            │
│ ☑ Include NOAA Weather Reports         │
│ ☑ Include Site Photos                  │
│ ☑ Include Daily Logs                   │
│ ☐ Include Schedule Impact Analysis     │
│                                         │
│ [Preview Report] [Generate & Download]  │
└─────────────────────────────────────────┘
```

## Dashboard Redesign for Reports

### Current Dashboard Problems:
- Reports are buried in navigation
- No clear call-to-action for documentation
- Users don't know when to create reports

### New Dashboard Design:

```
┌─────────────────────────────────────────┐
│          WeatherProof Dashboard         │
├─────────────────────────────────────────┤
│                                         │
│  🌦️ Current Weather Alert               │
│  High winds (28 mph) at Smith Project   │
│  [Document This Delay →]                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Quick Actions                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │    📸    │ │    🚨    │ │    📄    │ │
│  │Document │ │ Report  │ │Generate │  │
│  │ Delay   │ │  Issue  │ │  Claim  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Recent Delays (Action Needed)          │
│  ┌─────────────────────────────────┐   │
│  │ Mar 15 - High Winds             │   │
│  │ 8 hours lost · $2,400 impact    │   │
│  │ [📄 Add to Report] [✓ Verify]   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Mar 18 - Heavy Rain ⚠️          │   │
│  │ Needs weather verification       │   │
│  │ [🌦️ Fetch NOAA Data]            │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

## Smart Features to Implement

### 1. **Auto Weather Fetching**
```typescript
// When user starts documenting a delay
async function startDelayDocumentation(projectId: string) {
  const project = await getProject(projectId);
  
  // Automatically fetch weather for project location
  const weather = await fetchNOAAData({
    lat: project.latitude,
    lng: project.longitude,
    date: new Date()
  });
  
  // Check against thresholds
  const violations = checkThresholdViolations(weather, project.weather_thresholds);
  
  // Pre-fill delay form with violations
  return {
    weather,
    violations,
    suggestedDelayType: violations[0]?.type
  };
}
```

### 2. **Progressive Report Building**
Instead of requiring all data upfront, let users build reports over time:

```
Day 1: Quick photo + "work stopped"
Day 2: Add weather data when available
Day 3: Add cost calculations
Week later: Generate formal report with all data
```

### 3. **Smart Defaults**
- Pre-select crew size from project settings
- Auto-calculate costs based on project rates
- Default to most recent delays for reports
- Remember user's insurance info

## Simplified Database Structure

Instead of complex tables, focus on essentials:

```typescript
// Essential delay tracking
interface SimpleDelay {
  id: string;
  project_id: string;
  date: Date;
  weather_type: 'rain' | 'wind' | 'temp' | 'lightning' | 'other';
  hours_lost: number;
  crew_affected: number;
  
  // Auto-calculated
  labor_cost: number; // hours * crew * rate
  
  // Fetched on-demand
  noaa_data?: WeatherData;
  
  // User additions
  photos?: string[];
  notes?: string;
}

// Report just aggregates delays
interface InsuranceReport {
  delays: SimpleDelay[];
  period: { start: Date; end: Date };
  total_cost: number;
  
  // Added during generation
  weather_verification?: NOAAReport[];
  abnormal_analysis?: WeatherComparison;
}
```

## Implementation Priority

### Phase 1: Core Flow (Week 1)
1. ✅ "Document Current Delay" button on dashboard
2. ✅ Simple delay form with photo upload
3. ✅ On-demand NOAA weather fetching
4. ✅ Basic PDF report generation

### Phase 2: Smart Features (Week 2)
1. ⏱️ Real-time weather alerts
2. 📊 Threshold violation detection
3. 🔄 Progressive report building
4. 📱 Mobile-optimized documentation

### Phase 3: Advanced (Week 3)
1. 🤖 AI-powered claim descriptions
2. 📈 Historical weather comparisons
3. 🔗 Direct insurance submission
4. 📊 Analytics and insights

## User Journey Examples

### Emergency Documentation
```
1. Phone alert: "High winds at your project"
2. Tap notification → Opens camera
3. Take 3 photos of site conditions
4. Tap "Confirm Work Stopped"
5. Done! (Report generated later)
```

### Monthly Claim
```
1. Dashboard shows: "3 delays need claims"
2. Click "Generate Monthly Report"
3. Review pre-filled data
4. Click "Add NOAA Verification"
5. Download PDF for insurance
```

## Key Principles

1. **Don't Make Users Think** - Smart defaults everywhere
2. **Mobile First** - Most documentation happens on-site
3. **Progressive Enhancement** - Start simple, add detail later
4. **Verification Built-in** - NOAA data fetched automatically
5. **Action-Oriented** - Clear next steps always visible

## Next Steps

1. Update dashboard with quick action buttons
2. Create simple delay documentation form
3. Implement on-demand NOAA fetching
4. Build report generation wizard
5. Add mobile-optimized photo capture