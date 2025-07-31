export type ContractorType = 
  | 'General Contractor'
  | 'Concrete Contractor'
  | 'Roofing Contractor'
  | 'Electrical Contractor'
  | 'Plumbing Contractor'
  | 'HVAC Contractor'
  | 'Excavation Contractor'
  | 'Framing Contractor'
  | 'Painting Contractor'
  | 'Flooring Contractor'
  | 'Masonry Contractor'
  | 'Landscaping Contractor'
  | 'Other Specialty'

// Note: General Contractors typically coordinate work but may also self-perform some activities
// Subcontractors handle their own crews, equipment, and insurance claims
export const CONTRACTOR_TYPE_ACTIVITIES: Record<ContractorType, string[]> = {
  'General Contractor': [
    'Site Work',
    'Project Coordination',
    'Subcontractor Management',
    'Concrete Work', // May self-perform
    'Carpentry', // May self-perform
    'Drywall', // May self-perform
    'General Labor'
  ],
  'Concrete Contractor': [
    'Concrete Work',
    'Site Preparation',
    'Excavation',
    'Form Work',
    'Rebar Installation',
    'Concrete Pouring',
    'Finishing',
    'Curing',
    'Concrete Cutting',
    'Concrete Repair'
  ],
  'Roofing Contractor': [
    'Roofing',
    'Tear-off',
    'Decking Repair',
    'Underlayment Installation',
    'Shingle Installation',
    'Metal Roofing',
    'Flat Roofing',
    'Flashing Installation',
    'Gutter Installation',
    'Roof Repairs'
  ],
  'Electrical Contractor': [
    'Electrical',
    'Rough-in Wiring',
    'Panel Installation',
    'Circuit Installation',
    'Device Installation',
    'Lighting Installation',
    'Testing & Inspection',
    'Troubleshooting',
    'Emergency Repairs'
  ],
  'Plumbing Contractor': [
    'Plumbing',
    'Rough-in Plumbing',
    'Pipe Installation',
    'Fixture Installation',
    'Water Heater Installation',
    'Drain Cleaning',
    'Leak Repairs',
    'Testing & Inspection'
  ],
  'HVAC Contractor': [
    'HVAC',
    'Ductwork Installation',
    'Equipment Installation',
    'Control Systems',
    'Testing & Balancing',
    'Preventive Maintenance',
    'Emergency Repairs',
    'System Commissioning'
  ],
  'Excavation Contractor': [
    'Excavation',
    'Site Work',
    'Grading',
    'Trenching',
    'Foundation Excavation',
    'Utility Installation',
    'Backfill',
    'Compaction',
    'Demolition'
  ],
  'Framing Contractor': [
    'Carpentry',
    'Wall Framing',
    'Floor Framing',
    'Roof Framing',
    'Structural Steel',
    'Sheathing',
    'Window Installation',
    'Door Installation',
    'Deck Construction'
  ],
  'Painting Contractor': [
    'Painting',
    'Surface Preparation',
    'Drywall Repair',
    'Priming',
    'Interior Painting',
    'Exterior Painting',
    'Staining',
    'Pressure Washing',
    'Wallpaper Installation'
  ],
  'Flooring Contractor': [
    'Flooring',
    'Subfloor Preparation',
    'Subfloor Repair',
    'Underlayment Installation',
    'Hardwood Installation',
    'Tile Installation',
    'Carpet Installation',
    'Vinyl Installation',
    'Floor Finishing',
    'Floor Repairs'
  ],
  'Masonry Contractor': [
    'Masonry',
    'Block Work',
    'Brick Work',
    'Stone Work',
    'Concrete Block',
    'Mortar Work',
    'Tuckpointing',
    'Waterproofing',
    'Chimney Work',
    'Hardscaping'
  ],
  'Landscaping Contractor': [
    'Site Work',
    'Grading',
    'Excavation',
    'Planting',
    'Sod Installation',
    'Irrigation Installation',
    'Hardscape Installation',
    'Drainage Installation',
    'Mulching',
    'Tree Work'
  ],
  'Other Specialty': [] // User defines all activities
}