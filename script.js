document.addEventListener("DOMContentLoaded", () => {

    let map, routingControl;
    const useDynamicCharging = true;
    const fixedChargeTime = 30; // minutes

    function initMap() {
        map = L.map("map").setView([20.5937, 78.9629], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
        setTimeout(() => map.invalidateSize(), 200);
    }

    async function getCoordinates(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.length > 0 ? { lat: +data[0].lat, lng: +data[0].lon } : null;
    }

    async function reverseGeocode(lat, lng) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            return (
                data.address.city ||
                data.address.town ||
                data.address.village ||
                data.address.state ||
                "Unknown Location"
            );
        } catch {
            return "Unknown Location";
        }
    }

    // baseDate: Date, offsetMins: number
    function formatTime(baseDate, offsetMins) {
        const d = new Date(baseDate.getTime());
        d.setMinutes(d.getMinutes() + offsetMins);
        return d.toTimeString().split(":").slice(0, 2).join(":");
    }

    document.getElementById("planRoute").addEventListener("click", async () => {
        // 🔥 start loading animation
        if (typeof startRouteLoading === "function") startRouteLoading();

        const start = document.getElementById("start").value.trim();
        const end = document.getElementById("end").value.trim();

        const hoursInput = parseInt(document.getElementById("hours").value, 10);
        const minutesInput = parseInt(document.getElementById("minutes").value, 10);
        const ampm = document.getElementById("ampm").value;

        // basic validation
        if (!start || !end) {
            if (typeof stopRouteLoading === "function") stopRouteLoading();
            if (typeof showToast === "function") {
                showToast("Enter both Start & Destination!", "error");
            } else {
                alert("Enter both Start & Destination!");
            }
            return;
        }

        if (
            isNaN(hoursInput) ||
            isNaN(minutesInput) ||
            hoursInput < 1 ||
            hoursInput > 12 ||
            minutesInput < 0 ||
            minutesInput > 59
        ) {
            if (typeof stopRouteLoading === "function") stopRouteLoading();
            if (typeof showToast === "function") {
                showToast("Enter a valid journey start time!", "error");
            } else {
                alert("Enter a valid journey start time!");
            }
            return;
        }

        // convert to 24-hour clock
        let hours24 = hoursInput % 12;
        if (ampm === "PM") hours24 += 12;

        // base journey start Date (today, user-provided time)
        const journeyStart = new Date();
        journeyStart.setHours(hours24, minutesInput, 0, 0);

        const startC = await getCoordinates(start);
        const endC = await getCoordinates(end);

        if (!startC || !endC) {
            if (typeof stopRouteLoading === "function") stopRouteLoading();
            if (typeof showToast === "function") {
                showToast("Invalid locations!", "error");
            } else {
                alert("Invalid locations!");
            }
            return;
        }

        if (routingControl) map.removeControl(routingControl);

        routingControl = L.Routing.control({
            waypoints: [L.latLng(startC.lat, startC.lng), L.latLng(endC.lat, endC.lng)],
            routeWhileDragging: false,
            addWaypoints: false,
            show: false
        }).addTo(map);

        // success handler
        routingControl.on("routesfound", async (e) => {
            const route = e.routes[0];
            const summary = route.summary;

            const totalDist = summary.totalDistance / 1000;     // km
            const totalTimeHrs = summary.totalTime / 3600;      // hours

            document.getElementById("totalDist").innerText = totalDist.toFixed(1);
            document.getElementById("totalTime").innerText = Math.round(totalTimeHrs);
            document.getElementById("routeDetails").classList.remove("hidden");

            await calculateStops(route, totalDist, totalTimeHrs, journeyStart);

            if (typeof stopRouteLoading === "function") stopRouteLoading();
            if (typeof showToast === "function") {
                showToast("Route planned successfully!");
            }
        });

        // error handler – if OSRM / routing fails
        routingControl.on("routingerror", (e) => {
            console.error("Routing error:", e);
            if (typeof stopRouteLoading === "function") stopRouteLoading();
            if (typeof showToast === "function") {
                showToast("Failed to plan route. Please try again.", "error");
            } else {
                alert("Failed to plan route. Please try again.");
            }
        });
    });

    async function calculateStops(route, totalDist, totalTimeHrs, journeyStart) {
        const range = +document.getElementById("range").value || 250;
        const stopsDiv = document.getElementById("chargingStops");
        stopsDiv.innerHTML = "";

        const stopsCount = Math.floor(totalDist / range);
        if (stopsCount === 0) {
            stopsDiv.innerHTML = `
                <div class="p-2 text-green-700 text-center">No charging required!</div>
            `;
            return;
        }

        const coords = route.coordinates;
        const segmentMinutes = (totalTimeHrs * 60) / stopsCount;

        for (let i = 1; i <= stopsCount; i++) {
            const idx = Math.floor((i * range / totalDist) * coords.length);
            const point = coords[idx];

            const locName = await reverseGeocode(point.lat, point.lng);

            // elapsed minutes from journey start to this stop
            const elapsedToStop = i * segmentMinutes;

            const arrivalTime = formatTime(journeyStart, elapsedToStop);

            // chargeDur in MINUTES
            const chargeDur = useDynamicCharging
                ? Math.min(60, 30 + Math.floor(totalDist / range))
                : fixedChargeTime;

            const departureTime = formatTime(journeyStart, elapsedToStop + chargeDur);

            stopsDiv.innerHTML += `
                <div class="bg-white p-3 rounded shadow-sm mb-2">
                    <p class="font-bold">${locName}</p>
                    <p class="text-sm">Arrival: ${arrivalTime}</p>
                    <p class="text-sm">Departure: ${departureTime}</p>
                    <p class="text-sm">Charge: ${chargeDur} mins</p>
                </div>
            `;

            L.marker([point.lat, point.lng])
                .addTo(map)
                .bindPopup(
                    `<b>${locName}</b><br>
                     Arrival: ${arrivalTime}<br>
                     Departure: ${departureTime}<br>
                     Charge: ${chargeDur} mins`
                );
        }
    }

    initMap();
});
