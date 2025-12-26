// import { readFileSync } from "fs";
// import {
//   getFunctions,
//   renderMediaOnLambda,
//   getRenderProgress,
// } from "@remotion/lambda/client";

// // Load .env file
// const envFile = readFileSync(".env", "utf-8");
// envFile.split("\n").forEach((line) => {
//   const [key, ...valueParts] = line.split("=");
//   if (key && valueParts.length > 0) {
//     const value = valueParts
//       .join("=")
//       .trim()
//       .replace(/^["']|["']$/g, "");
//     process.env[key.trim()] = value;
//   }
// });

// console.log("Getting functions...");

// const functions = await getFunctions({
//   region: "us-east-1",
//   compatibleOnly: true,
// });

// const functionName = functions[0].functionName;

// console.log("Function name:", functionName);

// const { renderId, bucketName } = await renderMediaOnLambda({
//   region: "us-east-1",
//   functionName,
//   serveUrl:
//     "https://remotionlambda-useast1-5iy6mnvtvj.s3.us-east-1.amazonaws.com/sites/creem-recap/index.html",
//   composition: "HelloWorld",
//   inputProps: {
//     storeName: "Creem Store Example",
//     joinedDate: "2024-02-21",
//     totalRevenue: 146,
//     totalCustomers: 3,
//     countries: ["GB"],
//     bestCustomer: 45,
//     saleEveryMinutes: 5401,
//   },
//   codec: "h264",
//   imageFormat: "jpeg",
//   maxRetries: 1,
//   framesPerLambda: 20,
//   privacy: "public",
//   downloadBehavior: {
//     fileName: "creem-recap-2025.mp4",
//     type: "download",
//   },
// });

// //   const renderedId = "eggubwzn02"
// //   const bucketName = "creem-recap-2025"

// console.log("Render ID:", renderId);

// while (true) {
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   const progress = await getRenderProgress({
//     renderId,
//     bucketName,
//     functionName,
//     region: "us-east-1",
//   });
//   console.log("Progress:", progress.overallProgress);
//   if (progress.done) {
//     console.log("Render finished!", progress.outputFile);
//     process.exit(0);
//   }
//   if (progress.fatalErrorEncountered) {
//     console.error("Error enountered", progress.errors);
//     process.exit(1);
//   }
// }
