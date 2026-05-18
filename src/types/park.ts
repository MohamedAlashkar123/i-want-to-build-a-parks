export interface ParkRecord {
  id: string;
  sourceSheet: string;
  sourceRowNumber: number;
  municipality: 'ADM' | 'AAM' | 'DRM' | 'Unknown';
  parkName: string;
  parkReferenceNumber?: string;
  region?: string;
  parkType?: string;
  parkClassification?: string;
  supervisorEntity?: string;
  locationText?: string;
  coordinateRaw?: string;
  coordinateSource?:
    | 'Google Maps'
    | 'LatLng Text'
    | 'Projected XY'
    | 'Converted ADM X/Y'
    | 'Converted AAM X/Y'
    | 'Converted DRM X/Y'
    | 'Converted X/Y'
    | 'GIS Geodatabase'
    | 'Confirmed Smart Park Coordinates'
    | 'Confirmed Smart Park GPS'
    | 'Missing'
    | 'Unknown';
  coordinateConversionStatus?:
    | 'Ready for Map'
    | 'Converted for Map Visualization'
    | 'Conversion Review Required'
    | 'Pending CRS Confirmation'
    | 'Missing'
    | 'Invalid';
  canPlotOnMap?: boolean;
  gisValidationStatus?: 'Valid' | 'Suspicious' | 'Invalid' | 'Needs Review';
  gisValidationReason?: string;
  latitude?: number | null;
  longitude?: number | null;
  xyRawX?: string;
  xyRawY?: string;
  xyParsedX?: number | null;
  xyParsedY?: number | null;
  xyConvertedLatitude?: number | null;
  xyConvertedLongitude?: number | null;
  xyConversionReason?: string;
  hasCctvSystem: 'Yes' | 'No' | 'Unknown';
  totalCameras: number;
  hasMaintenanceContract: 'Yes' | 'No' | 'Unknown';
  maintenanceCompany?: string;
  maintenanceContractEndDate?: string;
  hasDrawings: 'Yes' | 'No' | 'Unknown';
  cameraSetupType: 'Standalone' | 'Integrated' | 'Unknown';
  dmtIntegrationStatus: 'Not Integrated' | 'Integrated' | 'To be confirmed' | 'Not Confirmed';
  isSmartPark?: boolean;
  smartParkMatchedName?: string;
  smartParkCapabilities?: string[];
  smartSystemAvailable?: boolean;
  hasSensors?: boolean;
  dmtIntegrationConfirmed?: boolean;
  dmtIntegrationScope?: string;
  aiVisitorCountingAvailable?: boolean;
  aiVisitorCountingCameraCount?: number;
  aiVisitorCountingMethod?: string;
  smartParkNote?: string;
  gisMatchStatus?: 'Matched' | 'Unmatched' | 'Manual';
  gisMatchScore?: number;
  gisMatchedName?: string;
  dataQualityIssues: string[];
}
