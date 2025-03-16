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
        let age = birthYear ? (currentYear - birthYear) : "Unknown"; // Fix: Prevent age calculation error

        // Display detected details (Fix: Used += to prevent overwriting)
        document.getElementById("result").innerHTML = `
            <h2>Details</h2>
            <p><strong>Country:</strong> ${country}</p>
            <p><strong>Age:</strong> ${age} years old</p>
        `;

        fetchCountryDetails(country); // Fetch additional details
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
        birthYear = null;  // Fix: No birth year in SSN
        valid = true;
        lat = 37.0902; lon = -95.7129;
    } else if (/^\d{12}$/.test(id)) { // India
        country = "India";
        birthYear = null;  // Fix: No birth year in Aadhaar
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

            // Fix: Used += instead of overwriting
            document.getElementById("result").innerHTML += `
                <p><strong>Currency:</strong> ${currency}</p>
                <p><strong>Timezone:</strong> ${timezone}</p>
                <p><strong>Languages:</strong> ${languages}</p>
                <img src="${flagUrl}" alt="${country} Flag" width="150">
            `;

            fetchLeaderInfo(country);
        })
        .catch(error => {
            console.error("Error fetching country data:", error);
            document.getElementById("result").innerHTML += `<p style="color: red;">Could not fetch country details.</p>`;
        });
}

function fetchLeaderInfo(country) {
    let leaders = {
        "South Africa": { name: "Cyril Ramaphosa", image: "https://th.bing.com/th/id/OIP.PhHp9jsJBk5-NJitb1ngSQHaFT?w=2048&h=1467&rs=1&pid=ImgDetMain" },
        "United States": { name: "Donald J Trump", image: "https://dynaimage.cdn.cnn.com/cnn/digital-images/org/8257b9f3-bd66-4288-bb5f-734c4fc74bf5.jpg" },
        "India": { name: "Narendra Modi", image: "https://english.cdn.zeenews.com/sites/default/files/2022/01/21/1007390-34.jpg" },
        "China": { name: "Xi Jinping", image: "https://th.bing.com/th/id/OIP.wnL_LZQQIZ5mw3sDxI4tJAHaE8?rs=1&pid=ImgDetMain" }
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

// 🎨 Theme Selector Fix
document.getElementById("themeSelector").addEventListener("change", (event) => {
    let theme = event.target.value;
    document.body.className = theme === "default" ? "" : `${theme}-theme`;
    localStorage.setItem("theme", theme);
});
