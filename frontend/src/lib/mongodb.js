import { MongoClient } from "mongodb";
import { EJSON } from "bson";

let _clientPromise;

function getClientPromise() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  if (!_clientPromise) {
    const uri = process.env.MONGODB_URI;
    const options = { appName: process.env.APP_NAME || "wind-turbine-diagnostics" };

    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      _clientPromise = client.connect();
      global._mongoClientPromise = _clientPromise;
    } else {
      _clientPromise = global._mongoClientPromise;
    }
  }

  return _clientPromise;
}

// Export a thenable object that initializes lazily
export const clientPromise = {
  then(onFulfilled, onRejected) {
    return getClientPromise().then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return getClientPromise().catch(onRejected);
  },
  finally(onFinally) {
    return getClientPromise().finally(onFinally);
  }
};

const changeStreams = new Map();

async function getChangeStream(filter, key) {
  if (!process.env.DATABASE_NAME) {
    throw new Error('Invalid/Missing environment variable: "DATABASE_NAME"');
  }

  if (!changeStreams.has(key)) {
    const client = await getClientPromise();
    const db = client.db(process.env.DATABASE_NAME);

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

export { getChangeStream };
