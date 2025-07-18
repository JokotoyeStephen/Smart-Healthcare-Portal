// State management
let patientData = {
  heartRate: 0,
  bloodPressure: { systolic: 0, diastolic: 0 },
  temperature: 0,
  diagnosis: null,
  status: {},
  history: { labels: [], heartRate: [] },
};
let chartInstance = null;

// DOM elements
const errorDiv = document.getElementById("error");
const heartRateEl = document.getElementById("heartRate");
const bloodPressureEl = document.getElementById("bloodPressure");
const temperatureEl = document.getElementById("temperature");
const heartRateStatusEl = document.getElementById("heartRateStatus");
const bloodPressureStatusEl = document.getElementById("bloodPressureStatus");
const temperatureStatusEl = document.getElementById("temperatureStatus");
const diagnosisEl = document.getElementById("diagnosis");
const fetchBtn = document.getElementById("fetchBtn");
const ehrBtn = document.getElementById("ehrBtn");

// Initialize Chart
function initChart() {
  const ctx = document.getElementById("vitalsChart").getContext("2d");
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: patientData.history.labels,
      datasets: [
        {
          label: "Heart Rate (bpm)",
          data: patientData.history.heartRate,
          borderColor: "rgba(34, 197, 94, 0.8)",
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Value" } },
        x: { title: { display: true, text: "Time" } },
      },
      plugins: { legend: { display: true, position: "top" } },
    },
  });
}

// Fetch IoT Data
async function fetchIoTData() {
  fetchBtn.disabled = true;
  fetchBtn.classList.add("btn-disabled");
  fetchBtn.textContent = "Fetching...";
  errorDiv.classList.add("hidden");

  try {
    const response = await axios.get(
      "https://api.mocki.io/v2/iot-health-data",
      {
        params: { patientId: "12345" },
        timeout: 5000,
      }
    );
    const { heartRate, bloodPressure, temperature } = response.data;
    patientData = {
      ...patientData,
      heartRate,
      bloodPressure,
      temperature,
      history: {
        labels: [
          ...patientData.history.labels,
          new Date().toLocaleTimeString(),
        ],
        heartRate: [...patientData.history.heartRate, heartRate],
      },
    };
    diagnosePatient();
    updateUI();
  } catch (error) {
    errorDiv.classList.remove("hidden");
    errorDiv.textContent = "Failed to fetch IoT data. Please try again.";
    console.error("IoT fetch error:", error);
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.classList.remove("btn-disabled");
    fetchBtn.textContent = "Fetch IoT Data";
  }
}

// AI Diagnosis Logic
function diagnosePatient() {
  let diagnosis = "Normal";
  patientData.status = {};
  if (patientData.heartRate > 100 || patientData.heartRate < 60) {
    diagnosis = "Abnormal heart rate detected";
    patientData.status.heartRate = "critical";
  }
  if (
    patientData.bloodPressure.systolic > 140 ||
    patientData.bloodPressure.diastolic > 90
  ) {
    diagnosis = "Hypertension detected";
    patientData.status.bloodPressure = "critical";
  }
  if (patientData.temperature > 38) {
    diagnosis = "Fever detected";
    patientData.status.temperature = "critical";
  }
  patientData.diagnosis = diagnosis;
}

// Save to EHR
async function saveToEHR() {
  try {
    await axios.post("https://api.mocki.io/v2/ehr", patientData, {
      headers: { "Content-Type": "application/json" },
    });
    alert("Data successfully saved to EHR!");
  } catch (error) {
    errorDiv.classList.remove("hidden");
    errorDiv.textContent = "Failed to save data to EHR.";
    console.error("EHR save error:", error);
  }
}

// Update UI
function updateUI() {
  heartRateEl.textContent = `${patientData.heartRate} bpm`;
  heartRateEl.className = `text-2xl font-bold ${
    patientData.status.heartRate === "critical"
      ? "text-red-600"
      : "text-green-600"
  }`;
  heartRateStatusEl.textContent =
    patientData.status.heartRate === "critical" ? "Critical" : "Normal";

  bloodPressureEl.textContent = `${patientData.bloodPressure.systolic}/${patientData.bloodPressure.diastolic} mmHg`;
  bloodPressureEl.className = `text-2xl font-bold ${
    patientData.status.bloodPressure === "critical"
      ? "text-red-600"
      : "text-green-600"
  }`;
  bloodPressureStatusEl.textContent =
    patientData.status.bloodPressure === "critical" ? "Critical" : "Normal";

  temperatureEl.textContent = `${patientData.temperature} °C`;
  temperatureEl.className = `text-2xl font-bold ${
    patientData.status.temperature === "critical"
      ? "text-red-600"
      : "text-green-600"
  }`;
  temperatureStatusEl.textContent =
    patientData.status.temperature === "critical" ? "Critical" : "Normal";

  diagnosisEl.textContent = patientData.diagnosis || "No diagnosis available";
  initChart();
}

// Event Listeners
fetchBtn.addEventListener("click", fetchIoTData);
ehrBtn.addEventListener("click", saveToEHR);

// Initialize Chart
initChart();
