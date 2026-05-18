export interface Inspection {
  id: string;
  projectCode: string;
  instalationName: string;
  inspectionType: {
    id: string;
    name: string;
  };
  dateTime: string;
  GPSLatitude: number;
  GPSLongitude: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  client: {
    id: string;
    clientName: string;
  };
  activities: {
    edges: Array<{
      node: {
        id: string;
        activityText: string;
      };
    }>;
  };
  subcontrateName: {
    edges: Array<{
      node: {
        id: string;
        subcontrateName: string;
      };
    }>;
  };
  observation: {
    id: string;
    observationText: string;
    photos: Array<{
      photo: string;
    }>;
  };
  polls: {
    edges: Array<{
      node: {
        id: string;
        status: string;
      };
    }>;
  };
}

export interface InspectionEdge {
  node: Inspection;
}

export interface InspectionsResponse {
  inspections: {
    edges: InspectionEdge[];
    totalCount: number;
  };
}
