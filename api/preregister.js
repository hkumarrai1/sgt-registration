const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  credentials: process.env.GOOGLE_CREDENTIALS
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
    : undefined,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

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

module.exports = async (req, res) => {
  const allowedOrigins = [
    "https://sgtofficial.in",
    "https://www.sgtofficial.in",
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

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

    const cleanWhatsapp = String(whatsapp).replace(/\D/g, "");

    if (cleanWhatsapp.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit WhatsApp number.",
      });
    }

    const registrationData = {
      full_name: String(full_name).trim(),
      username: String(username).trim(),
      whatsapp: cleanWhatsapp,
      email: String(email).trim(),
      instagram: instagram ? String(instagram).trim() : null,
      university: String(university).trim(),
      city: String(location).trim(),
      dob: dob,
      consent,
    };

    await addToGoogleSheet(registrationData);

    console.log("REGISTRATION ADDED TO GOOGLE SHEETS");

    return res.status(200).json({
      success: true,
      message: "Registration successful!",
    });
  } catch (error) {
    console.error("GOOGLE SHEETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Registration could not be completed. Please try again.",
    });
  }
};
