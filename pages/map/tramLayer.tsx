import { fetchTrams } from "../../api/requests";
import { LiveTram } from "../../models/liveTram";
import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";

const FRAMES_PER_DATAPOINT = 39;
const FRAME_TIME_ON_SCREEN = 4000;

interface TramPoint {
  properties: {
    name: string;
    amenity: string;
    popupContent: string;
    speed: string;
    ref: string;
    direction: string;
    destinationShortName: string;
  };
  geometry: {
    coordinates: {
      longitude: number;
      latitude: number;
    };
  };
}
interface SingleFrame {
  latitude: number;
  longitude: number;
  ref: string;
  speed?: number;
}

export const TramLayer = () => {
  const [tramCoordinates, setTramCoordinates] = useState<Array<SingleFrame>>(
    []
  );
  const [fetchedHandled, setFetchedHandled] = useState<boolean>(false);
  // Data where the frames rendering were calculated. After calculating the new frames with upcoming frames
  // This should be replaced
  const [currentData, setCurrentData] = useState<Array<TramPoint>>([]);
  // The frames that are rendered. After rendering, we empty the array further
  const [framesRendering, setFramesRendering] = useState<
    Array<Array<SingleFrame>>
  >([]);

  // The buffer of fetching; These should be calculated as soon as they are avabile
  const [upcomingData, setUpcomingData] = useState<Array<TramPoint>>([]);

  // We fetch and replace these frames with fetchData. They are transferred into current frame as seem fit
  const [fetchedData, setFetchedData] = useState<Array<TramPoint>>([]);
  const fetchData = async () => {
    //TODO Check if buffer is full enough so we don't flood it
    const tramData = await fetchTrams();
    const liveTramData: Array<LiveTram> = tramData;
    const coordArray: Array<TramPoint> = [];
    for (let i = 0; i < liveTramData.length; i++) {
      const coordinates =
        liveTramData[i].monitoredVehicleJourney.vehicleLocation;
      if (i === 0) console.log(liveTramData[i]);
      const geoJsonFeature: TramPoint = {
        properties: {
          name: "Ratikka",
          amenity: "Ratikka",
          popupContent: "Ratikka",
          speed: liveTramData[i].monitoredVehicleJourney.speed,
          ref: liveTramData[i].monitoredVehicleJourney.vehicleRef,
          direction: liveTramData[i].monitoredVehicleJourney.directionRef,
          destinationShortName:
            liveTramData[i].monitoredVehicleJourney.destinationShortName,
        },
        geometry: {
          coordinates: {
            longitude: parseFloat(coordinates.longitude),
            latitude: parseFloat(coordinates.latitude),
          },
        },
      };
      coordArray.push(geoJsonFeature);
    }
    setFetchedData(coordArray);
    setFetchedHandled(false);
  };
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), FRAME_TIME_ON_SCREEN);
    return () => clearInterval(interval);
  }, []);

  const callbackNextFrame = useCallback(() => {
    console.log(framesRendering.length);
    const currentFrame = tramCoordinates;
    const upcomingFrames = framesRendering;
    const theNextFrame = upcomingFrames.shift();
    setFramesRendering(upcomingFrames);
    const theNextRender: Array<SingleFrame> = [];
    if (theNextFrame) {
      if (currentFrame.length > 0) {
        for (let i = 0; i < theNextFrame?.length; i++) {
          const ref = theNextFrame[i].ref;
          for (let j = 0; j < currentFrame.length; j++) {
            if (currentFrame[j].ref === ref) {
              theNextRender.push({
                ref: ref,
                latitude: theNextFrame[i].latitude,
                longitude: theNextFrame[i].longitude,
                speed: theNextFrame[i].speed,
              });
            }
          }
        }
        setTramCoordinates(theNextRender);
      } else {
        setTramCoordinates(theNextFrame);
      }
    }
  }, [framesRendering, tramCoordinates]);

  const callbackUpdate = useCallback(() => {
    callbackNextFrame();
    // In here we take the upcoming data and splice it into new frames, if there is new data coming
    if (upcomingData.length > 0) {
      const coordsIntoFrames: Array<Array<SingleFrame>> = [];
      for (let y = 0; y < FRAMES_PER_DATAPOINT; y++) {
        coordsIntoFrames.push([]);
      }
      const lastBatchOfData = currentData;
      for (let i = 0; i < upcomingData.length; i++) {
        const coordinates = upcomingData[i].geometry.coordinates;
        const ref = upcomingData[i].properties.ref;
        let lastCoords: SingleFrame = {
          ref: "",
          longitude: 0,
          latitude: 0,
        };
        for (let i = 0; i < lastBatchOfData.length; i++) {
          if (ref === lastBatchOfData[i].properties.ref) {
            lastCoords = {
              longitude: lastBatchOfData[i].geometry.coordinates.longitude,
              latitude: lastBatchOfData[i].geometry.coordinates.latitude,
              ref: lastBatchOfData[i].properties.ref,
            };
            break;
          }
        }
        if (lastCoords.longitude === 0 || lastCoords.latitude === 0) {
          lastCoords.longitude = coordinates.longitude;
          lastCoords.latitude = coordinates.latitude;
        }
        //if(!lastCoords?.longitude || !lastCoords.latitude) lastCoords.longitude = coordinates.longitude;
        const longDiff = coordinates.longitude - lastCoords.longitude;
        const latDiff = coordinates.latitude - lastCoords.latitude;
        const longIncrement = longDiff / FRAMES_PER_DATAPOINT;
        const latIncrement = latDiff / FRAMES_PER_DATAPOINT;
        for (let j = 1; j <= FRAMES_PER_DATAPOINT; j++) {
          coordsIntoFrames[j - 1].push({
            latitude: lastCoords.latitude + latIncrement * j,
            longitude: lastCoords.longitude + longIncrement * j,
            ref: ref,
            speed: parseInt(upcomingData[i].properties.speed) ?? null,
          });
        }
        //const newFrame: SingleFrame
      }
      const newArrayOfArrays = [...coordsIntoFrames];
      setFramesRendering(newArrayOfArrays);
      setCurrentData(upcomingData);
      setUpcomingData([]);
    } else if (upcomingData.length === 0 && !fetchedHandled) {
      setUpcomingData(fetchedData);
      setFetchedHandled(true);
    }
  }, [
    currentData,
    fetchedData,
    upcomingData,
    callbackNextFrame,
    fetchedHandled,
  ]);
  useEffect(() => {
    const updateInterval = setInterval(
      () => callbackUpdate(),
      FRAME_TIME_ON_SCREEN / FRAMES_PER_DATAPOINT + 1
    );
    return () => clearInterval(updateInterval);
  }, [callbackUpdate]);

  function getColor(speed: number) {
    if (speed > 20) {
      return "red";
    } else if (speed > 10) {
      return "blue";
    } else {
      return "yellow";
    }
  }
  function getPolgyon(lat: number, long: number) {
    const firstPolygonCenter: LatLngExpression[] = getSquare(
      lat,
      long,
      0.002,
      0.001
    );
    const secondPolygonCenter: LatLngExpression[] = getSquare(
      lat,
      long,
      0.001,
      0.0
    );

    const thirdPolygonCenter: LatLngExpression[] = getSquare(
      lat,
      long,
      0.0,
      -0.001
    );
    return [firstPolygonCenter, secondPolygonCenter, thirdPolygonCenter];
  }
  function getSquare(
    lat: number,
    long: number,
    top: number,
    bottom: number
  ): LatLngExpression[] {
    return [
      [lat + top, long + top],
      [lat + bottom, long + top],
      [lat + bottom, long + bottom],
      [lat + top, long + bottom],
    ];
  }
  function getCircles() {
    const newArray: Array<any> = tramCoordinates.map((el) => {
      const color = getColor(el.speed ?? 0);
      const coords = getPolgyon(el.latitude, el.longitude);
      return (
        <Polygon
          positions={coords}
          key={el.ref}
          pathOptions={{ color: color }}
        />
      );
    });
    return newArray;
  }
  return <>{getCircles()}</>;
};
