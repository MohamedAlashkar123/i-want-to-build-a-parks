export interface UnifiedParkRecord {
  id: string;
  municipality: 'ADM' | 'AAM' | 'DRM' | 'Unknown';
  parkName: string;
  parkNameAr?: string;
  parkNameEn?: string;
  region?: string;
  parkType?: string;

  sourceSheet?: string;
  sourceRowNumber?: number;
  hasCctvSystem?: 'Yes' | 'No' | 'Unknown';
  totalCameras?: number;
  maintenanceContract?: 'Yes' | 'No' | 'Unknown';
  maintenanceCompany?: string;
  hasDrawings?: 'Yes' | 'No' | 'Unknown';

  gisId?: string;
  latitude?: number;
  longitude?: number;
  xCoord?: number;
  yCoord?: number;
  parkAreaSqm?: number;
  coordinateSource?: string;
  coordinateStatus?: 'Ready for Map' | 'Missing' | 'Invalid' | 'Pending Review';
  canPlotOnMap?: boolean;

  isSmartPark?: boolean;
  smartParkCapabilities?: string[];
  dmtIntegrationStatus?: 'Integrated' | 'Not Confirmed' | 'Not Available';
  aiVisitorCountingAvailable?: boolean;
  aiVisitorCountingCameraCount?: number;
  smartParkNote?: string;

  gisMatchStatus?: 'Matched' | 'Unmatched' | 'Manual';
  gisMatchScore?: number;
  gisMatchedName?: string;

  dataQualityIssues?: string[];
}
