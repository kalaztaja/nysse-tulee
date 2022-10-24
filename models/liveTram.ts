export interface LiveTram {
  validUntilTime: string;
  monitoredVehicleJourney: MonitoredVehicleJourney;
}

export interface MonitoredVehicleJourney {
  lineRef: string;
  directionRef: string;
  framedVehicleJourneyRef: FramedVehicleJourneyRef;
  vehicleLocation: VehicleLocation;
  operatorRef: string;
  bearing: string;
  delay: string;
  vehicleRef: string;
  journeyPatternRef: string;
  originShortName: string;
  destinationShortName: string;
  speed: string;
  originAimedDepartureTime: string;
}

export interface FramedVehicleJourneyRef {
  dateFrameRef: string;
  datedVehicleJourneyRef: string;
}

export interface VehicleLocation {
  longitude: string;
  latitude: string;
}
