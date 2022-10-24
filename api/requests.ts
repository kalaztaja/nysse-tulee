import axios from "axios";

export const fetchTrams = async () => {
  try {
    const response = await axios.get(
      "https://data.itsfactory.fi/journeys/api/1/vehicle-activity?exclude-fields=monitoredVehicleJourney.onwardCalls,recordedAtTime&lineRef=3"
    );
    return response.data.body;
  } catch (error) {}
};

fetchTrams();
