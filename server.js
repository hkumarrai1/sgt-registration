require("dotenv").config();

const express = require("express");
const path = require("path");
const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_CREDENTIALS
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
    : undefined,
  keyFile: process.env.GOOGLE_CREDENTIALS
    ? undefined
    : path.join(__dirname, "google-credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

// GOOGLE SHEETS CONFIG
const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

// Add registration to Google Sheet
async function addToGoogleSheet(data) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SPREADSHEET_ID,
    range: "Sheet1!A:J",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          data.full_name,
          data.username,
          data.whatsapp,
          data.email,
          data.instagram || "",
          data.university,
          data.city,
          data.dob,
          data.consent ? "Yes" : "No",
          new Date().toISOString(),
        ],
      ],
    },
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// BASIC CONFIG
// ================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve website files
app.use(express.static(__dirname));

// ================================
// REGISTER USER
// ================================

app.post("/api/preregister", async (req, res) => {
  try {
    const {
      full_name,
      username,
      whatsapp,
      email,
      instagram,
      university,
      location,
      dob,
      consent,
    } = req.body;

    // ================================
    // REQUIRED FIELD VALIDATION
    // ================================

    if (
      !full_name ||
      !username ||
      !whatsapp ||
      !email ||
      !university ||
      !location ||
      !dob
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    // ================================
    // WHATSAPP VALIDATION
    // ================================

    const cleanWhatsapp = String(whatsapp).replace(/\D/g, "");

    if (cleanWhatsapp.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit WhatsApp number.",
      });
    }

    // ================================
    // PREPARE DATA
    // ================================

    const registrationData = {
      full_name: String(full_name).trim(),

      username: String(username).trim(),

      whatsapp: cleanWhatsapp,

      email: String(email).trim(),

      instagram: instagram ? String(instagram).trim() : null,

      university: String(university).trim(),

      city: String(location).trim(),

      dob: dob,
    };

    try {
      await addToGoogleSheet({
        ...registrationData,
        consent,
      });

      console.log("REGISTRATION ADDED TO GOOGLE SHEETS");
    } catch (sheetError) {
      console.error("GOOGLE SHEETS ERROR:", sheetError);

      return res.status(500).json({
        success: false,
        message: "Registration could not be completed. Please try again.",
      });
    }

    // ================================
    // SUCCESS
    // ================================

    console.log("NEW REGISTRATION:", {
      full_name,
      username,
      email,
    });

    return res.json({
      success: true,

      message: "Registration successful!",
    });
  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Server error.",
    });
  }
});

// ================================
// BACKEND TEST
// ================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,

    message: "SGT backend is working!",
  });
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log(`SGT server running on http://localhost:${PORT}`);
});
