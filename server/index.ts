import express from "express";

const app = express();
const port = 5000;

app.get("/", (req, res) => {
  res.json({ 
    message: "TapLive Server Running!",
    timestamp: new Date().toISOString()
  });
});


app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});