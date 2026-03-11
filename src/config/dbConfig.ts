import mongoose from "mongoose";

const dbConfig = async function () {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI!);

    if (!connect.connection.host) {
      console.error("DB Error: Connection Err");
      process.exit(1);
    }

    return connect;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default dbConfig;
