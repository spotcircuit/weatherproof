# AI Delay Parsing Examples

## Example 1: Good Description
**Input:** "Heavy rain started at 9:15am. Had to stop pouring foundation for building A. Sent 8 crew members home at 11:30am. Tarped all exposed rebar. Crane and concrete pump sat idle."

**AI Output:**
```json
{
  "times": { "start": "09:15", "end": "11:30" },
  "weather": { "conditions": ["Heavy Rain"], "severity": "severe" },
  "activities": ["Concrete - Foundation"],
  "crew": { "action": "sent home", "count": 8 },
  "equipment": ["Crane", "Concrete Pump"],
  "materials": { "protected": true, "description": "Tarped exposed rebar" },
  "duration": 2.25,
  "summary": "Heavy rain stopped foundation pour, 8 crew sent home after 2.25 hours",
  "confidence": 95,
  "questions": []
}
```

## Example 2: Vague Description
**Input:** "Rain this morning, couldn't work"

**AI Output:**
```json
{
  "times": { "start": "07:00", "end": null },
  "weather": { "conditions": ["Rain"], "severity": "moderate" },
  "activities": [],
  "crew": { "action": "stood down" },
  "equipment": [],
  "materials": {},
  "summary": "Rain prevented work in the morning",
  "confidence": 40,
  "questions": [
    "What time did work resume (or when did you send the crew home)?",
    "What specific work activities had to stop?",
    "How many crew members were affected?",
    "Was any equipment sitting idle during the delay?"
  ]
}
```

## Example 3: Partial Information
**Input:** "High winds at 10am made crane work unsafe. Waited until 2pm."

**AI Output:**
```json
{
  "times": { "start": "10:00", "end": "14:00" },
  "weather": { "conditions": ["High Winds"], "severity": "severe" },
  "activities": ["Crane Operations"],
  "crew": {},
  "equipment": ["Crane"],
  "safety": ["crane operation unsafe"],
  "duration": 4,
  "summary": "High winds stopped crane work for 4 hours",
  "confidence": 75,
  "questions": [
    "How many crew members were affected by this delay?",
    "Were there other activities that had to stop besides crane work?",
    "What was the wind speed that made it unsafe?"
  ]
}
```

## Example 4: Complex Scenario
**Input:** "Started at 7 but by 8:30 the temp dropped to 38 degrees. Too cold for concrete so we covered everything with blankets and poly. Sent half the crew (6 guys) to work on interior framing instead. The concrete crew of 4 and the pump truck operator waited until 10:30 when it warmed up to 42."

**AI Output:**
```json
{
  "times": { "start": "08:30", "end": "10:30" },
  "weather": { 
    "conditions": ["Cold"], 
    "severity": "moderate",
    "temperature": 38
  },
  "activities": ["Concrete Work"],
  "crew": { 
    "action": "reassigned",
    "count": 10,
    "notes": "6 reassigned to interior, 4 concrete crew waited"
  },
  "equipment": ["Concrete Pump Truck"],
  "materials": { 
    "protected": true, 
    "description": "Covered with blankets and poly"
  },
  "safety": ["temperature too low for concrete"],
  "duration": 2,
  "summary": "Cold weather delayed concrete pour for 2 hours, partial crew reassigned",
  "confidence": 90,
  "questions": [
    "What was the specific concrete work planned (foundation, slab, walls)?",
    "Did the reassigned crew's interior work count as productive time?"
  ]
}
```

## How the AI Helps

1. **Time Interpretation**: Converts "morning" → 07:00, "lunch" → 12:00
2. **Weather Severity**: Determines if "rain" is light/moderate/severe based on context
3. **Activity Recognition**: Identifies construction activities from context
4. **Smart Questions**: Asks for missing critical information for insurance
5. **Confidence Score**: Indicates how complete the information is

## Tips for Better Descriptions

✅ **Good**: Include times, crew counts, specific activities, equipment
❌ **Avoid**: Vague terms like "bad weather" or "couldn't work"

The AI will help fill gaps, but more detail = better documentation = faster insurance approval!