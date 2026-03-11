import app from "./index.js";
import dbConfig from "./config/dbConfig.ts";

const PORT = process.env.PORT || 8000;

(async function () {
  try {
    const connect = await dbConfig();

    console.log(`DB Success: ${connect.connection.host}`);

    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
})();
