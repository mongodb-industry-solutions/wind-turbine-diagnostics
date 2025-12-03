import { MongoClient } from "mongodb";
import { EJSON } from "bson";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
if (!process.env.DATABASE_NAME) {
  throw new Error('Invalid/Missing environment variable: "DATABASE_NAME"');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;
const options = { appName: process.env.APP_NAME || "wind-turbine-diagnostics" };

let client;
let clientPromise;
const changeStreams = new Map();

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
} else {
  clientPromise = global._mongoClientPromise;
}

async function getChangeStream(filter, key) {
  if (!changeStreams.has(key)) {
    const client = await clientPromise;
    const db = client.db(dbName);

    const filterEJSON = EJSON.parse(JSON.stringify(filter));

    const pipeline = [{ $match: filterEJSON }];
    const changeStream = db.watch(pipeline);

    changeStream.on("change", (change) => {
      //console.log("Change: ", change);
    });

    changeStream.on("error", (error) => {
      console.log("Error: ", error);
    });

    changeStreams.set(key, changeStream);
  }
  return changeStreams.get(key);
}

export { clientPromise, getChangeStream };
