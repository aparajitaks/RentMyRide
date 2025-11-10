// backend/src/server.js
import app from "./app.js";

const PORT = process.env.PORT || 5001;

if (
  import.meta &&
  import.meta.url &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1])
) {
  // If executed directly: node server.js
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
