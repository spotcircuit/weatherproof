// ACORD Form 125 (Property Loss Notice) Mapping Service
// Maps WeatherProof data to ACORD standard fields for insurance claims

import { format } from 'date-fns/format'

// ACORD 125 Property Loss Notice structure
interface ACORD125 {
  // Header Information
  TransactionHeader: {
    CreateDateTime: string
    TransactionType: 'PropertyLossNotice'
    TransactionID: string
  }
  
  // Policy Information
  Policy: {
    PolicyNumber: string
    InsuredName: string
    InsuredAddress: {
      Line1: string
      City: string
      State: string
      PostalCode: string
    }
    EffectiveDate: string
    ExpirationDate?: string
    Coverages: {
      CoverageType: string
      Limit?: number
      Deductible?: number
    }[]
  }
  
  // Loss Information
  ClaimInfo: {
    ClaimNumber?: string
    LossDate: string
    ReportedDate: string
    LossTime?: string
    LossLocation: {
      Line1: string
      City: string
      State: string
      PostalCode: string
      Latitude?: number
      Longitude?: number
    }
    LossDescription: string
    CauseOfLoss: string
    LossType: string
    WeatherRelated: boolean
    
    // Property Damage Details
    PropertyDamage: {
      DamageDescription: string
      EstimatedAmount: number
      ActualCashValue?: number
      ReplacementCost?: number
    }
    
    // Business Interruption (for weather delays)
    BusinessInterruption?: {
      InterruptionStart: string
      InterruptionEnd?: string
      LostBusinessIncome: number
      ExtraExpense: number
      ContinuingExpenses: number
      Description: string
    }
  }
  
  // Contact Information
  ReportedBy: {
    Name: string
    Phone: string
    Email: string
    Relationship: string
  }
  
  // Additional Information
  AdditionalInfo?: {
    WeatherData?: {
      Source: string
      StationID: string
      Conditions: string
      WindSpeed?: number
      Precipitation?: number
      Temperature?: number
    }[]
    Photos?: {
      Description: string
      TakenDate: string
      Location?: string
    }[]
    WitnessInfo?: {
      Name: string
      Phone: string
      Statement: string
    }[]
  }
  
  // Signature
  Signature?: {
    SignedBy: string
    SignedDate: string
    Title: string
    ElectronicSignature: boolean
  }
}

// ACORD XML namespace
const ACORD_NAMESPACE = 'http://www.acord.org/schema/'

export class ACORDMapper {
  
  /**
   * Map WeatherProof report data to ACORD 125 format
   */
  mapToACORD125(reportData: any): ACORD125 {
    const now = new Date()
    
    return {
      TransactionHeader: {
        CreateDateTime: now.toISOString(),
        TransactionType: 'PropertyLossNotice',
        TransactionID: `WP-${reportData.reportId || Date.now()}`
      },
      
      Policy: {
        PolicyNumber: reportData.project.policy_number || 'PENDING',
        InsuredName: reportData.company.name,
        InsuredAddress: {
          Line1: reportData.company.address || reportData.project.address,
          City: this.extractCity(reportData.project.address),
          State: this.extractState(reportData.project.address),
          PostalCode: this.extractZip(reportData.project.address)
        },
        EffectiveDate: reportData.project.start_date || now.toISOString(),
        Coverages: [{
          CoverageType: 'WeatherDelay',
          Limit: reportData.policy?.limit,
          Deductible: reportData.policy?.deductible
        }]
      },
      
      ClaimInfo: {
        ClaimNumber: reportData.claimNumber,
        LossDate: reportData.claim_period.start,
        ReportedDate: now.toISOString(),
        LossLocation: {
          Line1: reportData.project.address,
          City: this.extractCity(reportData.project.address),
          State: this.extractState(reportData.project.address),
          PostalCode: this.extractZip(reportData.project.address),
          Latitude: reportData.project.lat,
          Longitude: reportData.project.lng
        },
        LossDescription: this.generateLossDescription(reportData),
        CauseOfLoss: 'Weather - Multiple Events',
        LossType: 'BusinessInterruption',
        WeatherRelated: true,
        
        PropertyDamage: {
          DamageDescription: 'No physical damage - Weather delays only',
          EstimatedAmount: 0
        },
        
        BusinessInterruption: {
          InterruptionStart: reportData.claim_period.start,
          InterruptionEnd: reportData.claim_period.end,
          LostBusinessIncome: reportData.summary.total_labor_cost,
          ExtraExpense: reportData.summary.total_equipment_cost,
          ContinuingExpenses: reportData.summary.total_overhead_cost,
          Description: this.generateInterruptionDescription(reportData)
        }
      },
      
      ReportedBy: {
        Name: reportData.company.contact,
        Phone: reportData.company.phone || 'Not provided',
        Email: reportData.company.email,
        Relationship: 'Insured/Contractor'
      },
      
      AdditionalInfo: {
        WeatherData: this.mapWeatherData(reportData.delays),
        Photos: this.mapPhotos(reportData.delays)
      },
      
      Signature: reportData.signature ? {
        SignedBy: reportData.signature.signedBy,
        SignedDate: reportData.signature.signedAt,
        Title: 'Project Manager',
        ElectronicSignature: true
      } : undefined
    }
  }
  
  /**
   * Generate ACORD-compliant XML
   */
  generateACORDXML(acordData: ACORD125): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ACORD xmlns="${ACORD_NAMESPACE}">
  <SignonRq>
    <SignonTransport>
      <SignonRoleCd>Agent</SignonRoleCd>
      <CustId>
        <CustPermId>WeatherProof</CustPermId>
        <CustLoginId>weatherproof-system</CustLoginId>
      </CustId>
    </SignonTransport>
    <ClientDt>${acordData.TransactionHeader.CreateDateTime}</ClientDt>
    <CustLangPref>en-US</CustLangPref>
    <ClientApp>
      <Org>WeatherProof</Org>
      <Name>WeatherProof System</Name>
      <Version>1.0</Version>
    </ClientApp>
  </SignonRq>
  
  <ClaimsSvcRq>
    <RqUID>${acordData.TransactionHeader.TransactionID}</RqUID>
    <LossNoticeAddRq>
      <RqUID>${acordData.TransactionHeader.TransactionID}-LN</RqUID>
      
      <Policy>
        <PolicyNumber>${acordData.Policy.PolicyNumber}</PolicyNumber>
        <LOBCd>PROP</LOBCd>
      </Policy>
      
      <Insured>
        <GeneralPartyInfo>
          <NameInfo>
            <CommlName>
              <CommercialName>${acordData.Policy.InsuredName}</CommercialName>
            </CommlName>
          </NameInfo>
          <Addr>
            <Addr1>${acordData.Policy.InsuredAddress.Line1}</Addr1>
            <City>${acordData.Policy.InsuredAddress.City}</City>
            <StateProvCd>${acordData.Policy.InsuredAddress.State}</StateProvCd>
            <PostalCode>${acordData.Policy.InsuredAddress.PostalCode}</PostalCode>
          </Addr>
        </GeneralPartyInfo>
      </Insured>
      
      <LossNotice>
        <LossDt>${acordData.ClaimInfo.LossDate}</LossDt>
        <LossTime>${acordData.ClaimInfo.LossTime || '00:00'}</LossTime>
        <ReportedDt>${acordData.ClaimInfo.ReportedDate}</ReportedDt>
        
        <LossLocation>
          <Addr>
            <Addr1>${acordData.ClaimInfo.LossLocation.Line1}</Addr1>
            <City>${acordData.ClaimInfo.LossLocation.City}</City>
            <StateProvCd>${acordData.ClaimInfo.LossLocation.State}</StateProvCd>
            <PostalCode>${acordData.ClaimInfo.LossLocation.PostalCode}</PostalCode>
          </Addr>
          ${acordData.ClaimInfo.LossLocation.Latitude ? `
          <GeographicCoord>
            <Latitude>${acordData.ClaimInfo.LossLocation.Latitude}</Latitude>
            <Longitude>${acordData.ClaimInfo.LossLocation.Longitude}</Longitude>
          </GeographicCoord>` : ''}
        </LossLocation>
        
        <LossDesc>${this.escapeXML(acordData.ClaimInfo.LossDescription)}</LossDesc>
        <LossCauseCd>WEATHER</LossCauseCd>
        
        ${acordData.ClaimInfo.BusinessInterruption ? `
        <Coverage>
          <CoverageCd>BUSINT</CoverageCd>
          <LossEstimateAmt>
            <Amt>${acordData.ClaimInfo.BusinessInterruption.LostBusinessIncome + 
                   acordData.ClaimInfo.BusinessInterruption.ExtraExpense + 
                   acordData.ClaimInfo.BusinessInterruption.ContinuingExpenses}</Amt>
          </LossEstimateAmt>
        </Coverage>` : ''}
        
        <ReportedBy>
          <GeneralPartyInfo>
            <NameInfo>
              <PersonName>
                <GivenName>${acordData.ReportedBy.Name}</GivenName>
              </PersonName>
            </NameInfo>
            <Communications>
              <PhoneInfo>
                <PhoneNumber>${acordData.ReportedBy.Phone}</PhoneNumber>
              </PhoneInfo>
              <EmailInfo>
                <EmailAddr>${acordData.ReportedBy.Email}</EmailAddr>
              </EmailInfo>
            </Communications>
          </GeneralPartyInfo>
          <ReportedByRelationshipCd>INSURED</ReportedByRelationshipCd>
        </ReportedBy>
        
        ${this.generateWeatherDataXML(acordData.AdditionalInfo?.WeatherData)}
        
        ${acordData.Signature ? `
        <SignatureInfo>
          <SignatureName>${acordData.Signature.SignedBy}</SignatureName>
          <SignatureDt>${acordData.Signature.SignedDate}</SignatureDt>
          <SignatureTypeCd>ELECTRONIC</SignatureTypeCd>
        </SignatureInfo>` : ''}
      </LossNotice>
    </LossNoticeAddRq>
  </ClaimsSvcRq>
</ACORD>`
    
    return xml
  }
  
  /**
   * Generate loss description from delays
   */
  private generateLossDescription(reportData: any): string {
    const delayCount = reportData.delays.length
    const totalHours = reportData.summary.total_hours_lost
    const totalCost = reportData.summary.total_claim_amount
    
    const conditions = new Set<string>()
    reportData.delays.forEach((delay: any) => {
      delay.weather_events.forEach((event: any) => {
        conditions.add(event.condition)
      })
    })
    
    return `Weather-related construction delays at ${reportData.project.name}. ` +
           `${delayCount} separate delay events totaling ${totalHours} hours of lost productivity. ` +
           `Weather conditions included: ${Array.from(conditions).join(', ')}. ` +
           `Total claimed amount: $${totalCost.toLocaleString()}.`
  }
  
  /**
   * Generate business interruption description
   */
  private generateInterruptionDescription(reportData: any): string {
    const details: string[] = []
    
    reportData.delays.forEach((delay: any) => {
      const activities = delay.activities_affected.join(', ')
      details.push(`${delay.date}: ${delay.hours_lost} hours lost affecting ${activities}`)
    })
    
    return details.join('; ')
  }
  
  /**
   * Map weather data to ACORD format
   */
  private mapWeatherData(delays: any[]): any[] {
    const weatherData: any[] = []
    
    delays.forEach(delay => {
      delay.weather_events?.forEach((event: any) => {
        weatherData.push({
          Source: event.source,
          StationID: event.source.split(' - Station ')[1] || 'Unknown',
          Conditions: event.condition,
          WindSpeed: event.condition.includes('Wind') ? event.value : undefined,
          Precipitation: event.condition.includes('Rain') || event.condition.includes('Precip') ? event.value : undefined,
          Temperature: event.condition.includes('Temp') ? event.value : undefined
        })
      })
    })
    
    return weatherData
  }
  
  /**
   * Map photos to ACORD format
   */
  private mapPhotos(delays: any[]): any[] {
    const photos: any[] = []
    
    delays.forEach(delay => {
      delay.photos?.forEach((photo: any) => {
        photos.push({
          Description: photo.caption || `Weather conditions on ${delay.date}`,
          TakenDate: photo.takenAt,
          Location: photo.location !== 'Not available' ? photo.location : undefined
        })
      })
    })
    
    return photos
  }
  
  /**
   * Generate weather data XML section
   */
  private generateWeatherDataXML(weatherData?: any[]): string {
    if (!weatherData || weatherData.length === 0) return ''
    
    return `
        <AdditionalInfo>
          <MiscPartyInfo>
            <MiscPartyDesc>Weather Data</MiscPartyDesc>
            ${weatherData.map(data => `
            <MiscPartySubInfo>
              <MiscPartySubDesc>Weather Reading</MiscPartySubDesc>
              <MiscPartySubDetail>
                <DetailName>Source</DetailName>
                <DetailValue>${data.Source}</DetailValue>
              </MiscPartySubDetail>
              <MiscPartySubDetail>
                <DetailName>Conditions</DetailName>
                <DetailValue>${data.Conditions}</DetailValue>
              </MiscPartySubDetail>
              ${data.WindSpeed ? `
              <MiscPartySubDetail>
                <DetailName>WindSpeed</DetailName>
                <DetailValue>${data.WindSpeed} mph</DetailValue>
              </MiscPartySubDetail>` : ''}
              ${data.Precipitation ? `
              <MiscPartySubDetail>
                <DetailName>Precipitation</DetailName>
                <DetailValue>${data.Precipitation} inches</DetailValue>
              </MiscPartySubDetail>` : ''}
            </MiscPartySubInfo>`).join('')}
          </MiscPartyInfo>
        </AdditionalInfo>`
  }
  
  /**
   * Extract city from address
   */
  private extractCity(address: string): string {
    const parts = address.split(',')
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim()
    }
    return 'Unknown'
  }
  
  /**
   * Extract state from address
   */
  private extractState(address: string): string {
    const stateZipPattern = /\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/
    const match = address.match(stateZipPattern)
    return match ? match[1] : 'Unknown'
  }
  
  /**
   * Extract ZIP from address
   */
  private extractZip(address: string): string {
    const zipPattern = /\b\d{5}(?:-\d{4})?\b/
    const match = address.match(zipPattern)
    return match ? match[0] : '00000'
  }
  
  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

export const acordMapper = new ACORDMapper()