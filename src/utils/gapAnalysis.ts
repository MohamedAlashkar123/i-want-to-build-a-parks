import type { ParkRecord } from '../types/park';
import { isInventoryPark } from './dashboardCalculations';

export interface GapAnalysisRecord {
  id: string;
  municipality: string;
  parkName: string;
  gapCategory: string;
  issue: string;
  recommendedAction: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'To be validated';
  sourceSheet: string;
  sourceRowNumber: number;
}

function hasValidGisCoordinates(park: ParkRecord): boolean {
  return (
    typeof park.latitude === 'number' &&
    typeof park.longitude === 'number' &&
    Number.isFinite(park.latitude) &&
    Number.isFinite(park.longitude) &&
    park.latitude >= -90 &&
    park.latitude <= 90 &&
    park.longitude >= -180 &&
    park.longitude <= 180
  );
}

function createGap(
  park: ParkRecord,
  ruleId: string,
  gap: Omit<GapAnalysisRecord, 'id' | 'municipality' | 'parkName' | 'sourceSheet' | 'sourceRowNumber'>,
): GapAnalysisRecord {
  return {
    id: `${park.id}-${ruleId}`,
    municipality: park.municipality,
    parkName: park.parkName,
    sourceSheet: park.sourceSheet,
    sourceRowNumber: park.sourceRowNumber,
    ...gap,
  };
}

export function generateGapAnalysis(parks: ParkRecord[]): GapAnalysisRecord[] {
  return parks.filter(isInventoryPark).flatMap((park) => {
    const gaps: GapAnalysisRecord[] = [];

    if (park.hasCctvSystem === 'No') {
      gaps.push(
        createGap(park, 'no-cctv', {
          gapCategory: 'CCTV',
          issue: 'لا يوجد نظام CCTV',
          recommendedAction: 'تقييم الحاجة لتركيب نظام كاميرات حسب أهمية وموقع الحديقة',
          priority: 'High',
          status: 'Open',
        }),
      );
    }

    if (park.hasCctvSystem === 'Unknown') {
      gaps.push(
        createGap(park, 'unknown-cctv', {
          gapCategory: 'Data Quality',
          issue: 'حالة نظام CCTV غير مؤكدة',
          recommendedAction: 'مراجعة البيانات مع البلدية المعنية وتأكيد حالة نظام الكاميرات',
          priority: 'Medium',
          status: 'To be validated',
        }),
      );
    }

    if (park.hasCctvSystem === 'Yes' && park.totalCameras === 0) {
      gaps.push(
        createGap(park, 'cctv-zero-cameras', {
          gapCategory: 'Camera Inventory',
          issue: 'نظام CCTV موجود ولكن عدد الكاميرات غير مسجل',
          recommendedAction: 'تحديث حصر الكاميرات وتأكيد العدد الفعلي',
          priority: 'Medium',
          status: 'To be validated',
        }),
      );
    }

    if (!hasValidGisCoordinates(park)) {
      gaps.push(
        createGap(park, 'missing-gis', {
          gapCategory: 'GIS',
          issue: 'إحداثيات GIS غير متوفرة أو غير صالحة',
          recommendedAction: 'توفير إحداثيات Latitude/Longitude صحيحة للعرض على الخريطة',
          priority: 'Medium',
          status: 'To be validated',
        }),
      );
    }

    if (park.hasMaintenanceContract === 'No') {
      gaps.push(
        createGap(park, 'no-maintenance-contract', {
          gapCategory: 'Maintenance',
          issue: 'لا يوجد عقد صيانة مسجل',
          recommendedAction: 'تأكيد آلية الصيانة والجهة المسؤولة عن الدعم والتشغيل',
          priority: 'Medium',
          status: 'Open',
        }),
      );
    }

    if (park.hasMaintenanceContract === 'Unknown' && park.hasCctvSystem === 'Yes') {
      gaps.push(
        createGap(park, 'unknown-maintenance-contract', {
          gapCategory: 'Maintenance',
          issue: 'حالة عقد الصيانة غير مؤكدة',
          recommendedAction: 'تأكيد وجود عقد صيانة للكاميرات مع الجهة المالكة أو البلدية',
          priority: 'Medium',
          status: 'To be validated',
        }),
      );
    }

    if (park.hasDrawings === 'No' && park.hasCctvSystem === 'Yes') {
      gaps.push(
        createGap(park, 'no-drawings', {
          gapCategory: 'Documentation',
          issue: 'مخططات الكاميرات غير متوفرة',
          recommendedAction: 'توفير المخططات الفنية ومواقع الكاميرات لدعم التقييم والتوسعة',
          priority: 'Low',
          status: 'Open',
        }),
      );
    }

    if (
      park.hasCctvSystem === 'Yes' &&
      !park.isSmartPark &&
      (park.dmtIntegrationStatus === 'Not Integrated' ||
        park.dmtIntegrationStatus === 'Not Confirmed' ||
        park.dmtIntegrationStatus === 'To be confirmed')
    ) {
      gaps.push(
        createGap(park, 'dmt-not-confirmed', {
          gapCategory: 'Integration',
          issue: 'حالة الربط مع أنظمة DMT غير مؤكدة',
          recommendedAction: 'تأكيد حالة الربط مع أنظمة DMT في دورة التحقق القادمة',
          priority: 'Medium',
          status: 'Open',
        }),
      );
    }

    return gaps;
  });
}
