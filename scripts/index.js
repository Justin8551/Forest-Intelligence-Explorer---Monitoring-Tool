document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("health-btn"); 
    const printBtn = document.getElementById("print-btn"); 
    
    const statusEl = document.getElementById("health-status");
    const mapEl = document.getElementById("map");
    const statsContainer = document.getElementById("stats-container");
    const statsContent = document.getElementById("stats-content");

    if (!button || !statusEl) return;
    
    const zebraApi = ZebraHackApi.createClient({
        appKey: "tema4-tw"
    });

    async function getLocationName(lat, lng) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const res = await fetch(url);
            const data = await res.json();
            return data.address.city || data.address.village || data.address.county || "Locatie necunoscuta.";
        } catch (e) {
            return "Serviciu indisponibil.";
        }
    }

    if(printBtn) {
        printBtn.addEventListener("click", () => {
            window.print();
        });
    }

    const startExplorer = async (event) => {
        if (event) event.preventDefault();

        statusEl.textContent = "Se descarca datele...";
        mapEl.style.display = "block";

        try {
            if (window.myMap) window.myMap.remove();
            window.myMap = L.map('map').setView([46.0, 25.0], 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(window.myMap);

            const [companiesData, insightsData] = await Promise.all([
                zebraApi.getCompanies(), 
                zebraApi.getInsights()
            ]);

            let punctedesenate = 0;
            const limita = 1000;

            companiesData.companies.forEach(comp => {
                if (punctedesenate >= limita) return;
                
                let lat = comp.latitude;
                let lng = comp.longitude;
                if (!lat && comp.center) { lat = comp.center.latitude; lng = comp.center.longitude; }

                if (lat && lng) {
                    const marker = L.marker([lat, lng]).addTo(window.myMap);
                    marker.on('click', async () => {
                        marker.bindPopup("Se cauta adresa...").openPopup();
                        const loc = await getLocationName(lat, lng);
                        marker.setPopupContent(`<b>${comp.name}</b><br>Volum: ${comp.transport_count}<br>${loc}`);
                    });
                    punctedesenate++;
                }
            });
            
            statusEl.textContent = `Date totale gasite: ${companiesData.companies.length}. Afisate pe harta: ${punctedesenate}`;

            if (statsContainer && insightsData.species) {
                statsContainer.style.display = "block";
                const topSpecii = insightsData.species.slice(0, 3);
                let toptransport = `<p>Cele mai transportate specii de lemn:</p><ul>`;
                topSpecii.forEach(s => toptransport += `<li><b>${s.name}</b>: ${s.volume} m<sup>3</sup></li>`);
                toptransport += `</ul>`;
                if(statsContent) statsContent.innerHTML = toptransport;
            }

            if(printBtn) {
                printBtn.style.display = "inline-block";
            }

        } catch (err) {
            console.error(err);
            statusEl.innerHTML = `<span style="color:red">Eroare: ${err.message}</span>`;
            button.disabled = false;
        }
    };

    button.addEventListener("click", startExplorer);
});