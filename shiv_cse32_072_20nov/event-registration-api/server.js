const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// In-memory data store with initial records
let registrations = [
  {
    id: 501,
    participantName: "Riya Sharma",
    eventName: "Tech Fest",
    department: "CSE",
    ticketCount: 2,
    paymentStatus: "Paid",
  },
  {
    id: 502,
    participantName: "Arjun Mehta",
    eventName: "Code Sprint",
    department: "IT",
    ticketCount: 1,
    paymentStatus: "Pending",
  },
  {
    id: 503,
    participantName: "Neha Verma",
    eventName: "Tech Fest",
    department: "ECE",
    ticketCount: 3,
    paymentStatus: "Paid",
  },
];

let nextId = 504;

// Helper function to validate registration payload
function validateRegistrationPayload(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be a valid JSON object.";
  }

  const {
    participantName,
    eventName,
    department,
    ticketCount,
    paymentStatus,
  } = body;

  if (typeof participantName !== "string" || participantName.trim() === "") {
    return "participantName is required and must be a non-empty string.";
  }

  if (typeof eventName !== "string" || eventName.trim() === "") {
    return "eventName is required and must be a non-empty string.";
  }

  if (typeof department !== "string" || department.trim() === "") {
    return "department is required and must be a non-empty string.";
  }

  if (typeof ticketCount !== "number" || !Number.isInteger(ticketCount) || ticketCount <= 0) {
    return "ticketCount must be a positive integer.";
  }

  if (paymentStatus !== "Paid" && paymentStatus !== "Pending") {
    return 'paymentStatus must be either "Paid" or "Pending".';
  }

  return null;
}

// Root health check route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Event Registration Management API is running.",
  });
});

// 6. Filter records by department (case-insensitive)
// Must be defined BEFORE /api/registrations/:id
app.get("/api/registrations/filter", (req, res) => {
  const { department } = req.query;

  if (typeof department !== "string" || department.trim() === "") {
    return res.status(400).json({
      error: "Query parameter 'department' is required.",
    });
  }

  const targetDept = department.trim().toLowerCase();
  const filtered = registrations.filter(
    (reg) => reg.department.toLowerCase() === targetDept
  );

  return res.status(200).json(filtered);
});

// 7. GET pending registrations
// Must be defined BEFORE /api/registrations/:id
app.get("/api/registrations/pending", (req, res) => {
  const pendingRegistrations = registrations.filter(
    (reg) => reg.paymentStatus === "Pending"
  );

  return res.status(200).json(pendingRegistrations);
});

// 1. GET all records
app.get("/api/registrations", (req, res) => {
  return res.status(200).json(registrations);
});

// 3. GET registration by ID
app.get("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(404).json({
      error: "Registration not found.",
    });
  }

  const record = registrations.find((reg) => reg.id === id);

  if (!record) {
    return res.status(404).json({
      error: `Registration with ID ${id} not found.`,
    });
  }

  return res.status(200).json(record);
});

// 2. POST a new record
app.post("/api/registrations", (req, res) => {
  const validationError = validateRegistrationPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
    });
  }

  const newRecord = {
    id: nextId++,
    participantName: req.body.participantName.trim(),
    eventName: req.body.eventName.trim(),
    department: req.body.department.trim(),
    ticketCount: req.body.ticketCount,
    paymentStatus: req.body.paymentStatus,
  };

  registrations.push(newRecord);

  return res.status(201).json(newRecord);
});

// 4. PUT / update a record by ID
app.put("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(404).json({
      error: "Registration not found.",
    });
  }

  const index = registrations.findIndex((reg) => reg.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: `Registration with ID ${id} not found.`,
    });
  }

  const validationError = validateRegistrationPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      error: validationError,
    });
  }

  const updatedRecord = {
    id,
    participantName: req.body.participantName.trim(),
    eventName: req.body.eventName.trim(),
    department: req.body.department.trim(),
    ticketCount: req.body.ticketCount,
    paymentStatus: req.body.paymentStatus,
  };

  registrations[index] = updatedRecord;

  return res.status(200).json(updatedRecord);
});

// 5. DELETE a record by ID
app.delete("/api/registrations/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(404).json({
      error: "Registration not found.",
    });
  }

  const index = registrations.findIndex((reg) => reg.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: `Registration with ID ${id} not found.`,
    });
  }

  const [deletedRecord] = registrations.splice(index, 1);

  return res.status(200).json({
    message: `Registration with ID ${id} deleted successfully.`,
    deletedRecord,
  });
});

// Handle malformed JSON syntax gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON payload.",
    });
  }
  return res.status(500).json({
    error: "Internal server error.",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});