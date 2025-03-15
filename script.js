function processID() {
    let id = document.getElementById("idInput").value.trim();

    // Show loading animation
    document.getElementById("loading").style.display = "block";

    setTimeout(() => {
        let animation = document.getElementById("processing-animation");
        animation.style.display = "block"; // Show animation

        let { country, birthYear, valid, lat, lon } = detectIDFormat(id);

        document.getElementById("loading").style.display = "none"; // Hide loading

        if (!valid) {
            document.getElementById("result").innerHTML = `<p style="color:red;">Invalid ID format.</p>`;
            return;
        }

        let currentYear = new Date().getFullYear();
        let age = currentYear - birthYear;

        // Fetch country details & update UI
        fetchCountryDetails(country);

        document.getElementById("result").innerHTML = `
            <h2>Details</h2>
            <p><strong>Country:</strong> ${country}</p>
            <p><strong>Age:</strong> ${age} years old</p>
        `;

        updateMap(lat, lon);
    }, 2000);
}

function detectIDFormat(id) {
    let country = "Unknown";
    let birthYear = null;
    let valid = false;
    let lat = 0, lon = 0;

    if (/^\d{13}$/.test(id)) { // South Africa
        country = "South Africa";
        birthYear = parseInt(id.substring(0, 2));
        birthYear = birthYear > 30 ? 1900 + birthYear : 2000 + birthYear;
        valid = true;
        lat = -30; lon = 25;
    } else if (/^\d{3}-\d{2}-\d{4}$/.test(id)) { // USA
        country = "United States";
        valid = true;
        lat = 37.0902; lon = -95.7129;
    } else if (/^\d{12}$/.test(id)) { // India
        country = "India";
        valid = true;
        lat = 20.5937; lon = 78.9629;
    } else if (/^\d{18}$/.test(id)) { // China
        country = "China";
        birthYear = parseInt(id.substring(6, 10));
        valid = true;
        lat = 35.8617; lon = 104.1954;
    } 

    return { country, birthYear, valid, lat, lon };
}

function fetchCountryDetails(country) {
    let apiUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=true`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error("Country not found");
            return response.json();
        })
        .then(data => {
            console.log("Country API Response:", data);

            let countryInfo = data[0] || {};
            let currency = countryInfo.currencies ? Object.values(countryInfo.currencies)[0].name : "N/A";
            let timezone = countryInfo.timezones ? countryInfo.timezones[0] : "N/A";
            let languages = countryInfo.languages ? Object.values(countryInfo.languages).join(", ") : "N/A";
            let flagUrl = countryInfo.flags?.png || countryInfo.flags?.svg || "";

            document.getElementById("result").innerHTML += `
                <p><strong>Currency:</strong> ${currency}</p>
                <p><strong>Timezone:</strong> ${timezone}</p>
                <p><strong>Languages:</strong> ${languages}</p>
                <img src="${flagUrl}" alt="${country} Flag" width="150">
            `;

            // Fetch leader info separately
            fetchLeaderInfo(country);
        })
        .catch(error => {
            console.error("Error fetching country data:", error);
            document.getElementById("result").innerHTML += `<p style="color: red;">Could not fetch country details.</p>`;
        });
}

function fetchLeaderInfo(country) {
    let leaders = {
        "South Africa": { name: "Cyril Ramaphosa", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Cyril_Ramaphosa_2019.jpg/640px-Cyril_Ramaphosa_2019.jpg" },
        "United States": { name: "Joe Biden", image: "https://upload.wikimedia.org/wikipedia/commons/6/68/Joe_Biden_presidential_portrait.jpg" },
        "India": { name: "Narendra Modi", image: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Narendra_Modi_2023.jpg" },
        "China": { name: "Xi Jinping", image: "https://upload.wikimedia.org/wikipedia/commons/4/42/Xi_Jinping_2019.jpg" }
    };

    let leader = leaders[country] || { name: "Unknown", image: "https://via.placeholder.com/150" };

    document.getElementById("result").innerHTML += `
        <p><strong>President/Leader:</strong> ${leader.name}</p>
        <img src="${leader.image}" alt="${leader.name}" width="100">
    `;
}

// 🌍 Fix: Prevent map from resetting on every call
let map;
let markers = [];

function updateMap(lat, lon) {
    if (!map) {
        map = L.map('map').setView([lat, lon], 4);
    
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } else {
        map.setView([lat, lon], 4);
    }

    // Remove existing markers to prevent duplicates
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    let newMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup("Detected Country")
        .openPopup();
    
    markers.push(newMarker);
}

// 🌓 Dark Mode Toggle
document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
});

// Apply Dark Mode on Page Load
if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
}

// 🎨 Apply Saved Theme
let savedTheme = localStorage
document.getElementById("themeSelector").addEventListener("change", (event) => {
    let theme = event.target.value;
    document.body.className = theme === "default" ? "" : `${theme}-theme`;
    localStorage.setItem("theme", theme);
});
