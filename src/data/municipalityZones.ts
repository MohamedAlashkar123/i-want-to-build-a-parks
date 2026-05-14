export const municipalityZones: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        municipality: 'ADM',
        name: 'Abu Dhabi Municipality',
        type: 'Indicative Municipality Zone',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [53.8, 23.5],
            [55.8, 23.5],
            [55.8, 25.0],
            [53.8, 25.0],
            [53.8, 23.5],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        municipality: 'AAM',
        name: 'Al Ain Municipality',
        type: 'Indicative Municipality Zone',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [55.3, 23.75],
            [56.35, 23.75],
            [56.35, 24.55],
            [55.3, 24.55],
            [55.3, 23.75],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        municipality: 'DRM',
        name: 'Al Dhafra Region Municipality',
        type: 'Indicative Municipality Zone',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [51.5, 22.5],
            [54.8, 22.5],
            [54.8, 24.8],
            [51.5, 24.8],
            [51.5, 22.5],
          ],
        ],
      },
    },
  ],
};
