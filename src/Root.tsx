import "./index.css";
import { Composition } from "remotion";
import Creem from "./Creem";
import Weather from "./Weather";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={Creem}
        durationInFrames={60 * 43}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          storeName: "Creem",
          joinedDate: "2025-12-01",
          totalRevenue: 1274,
          totalCustomers: 5,
          countries: [
            "GB",
            "CA",
            "AU",
            "DE",
            "FR",
            "ES",
            "IT",
            "NL",
            "BE",
            "SE",
          ],
          bestCustomer: 124,
          saleEveryMinutes: 5400,
        }}
      />
      <Composition
        id="Weather"
        component={Weather}
        durationInFrames={60 * 5} // 5 seconds
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          city: "Puerto Ordaz",
          useAI: true, // 👈 Uses AI-generated images and weather data
          // Temperature, condition, and date will be loaded automatically from the manifest
        }}
      />
    </>
  );
};
