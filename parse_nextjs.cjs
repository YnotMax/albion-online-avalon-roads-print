const fs = require("fs");
const t = fs.readFileSync("script_40.txt", "utf8");

// Since it's inside self.__next_f.push([1,"..."]), the entire payload is a JSON string literal.
// So we can parse the line as JSON.
const lines = t.split('\n');
for (const line of lines) {
    if (line.startsWith('self.__next_f.push([1,"')) {
        try {
            // Extracts the array [1, "..."]
            const jsonArrayStr = line.substring(line.indexOf('['), line.lastIndexOf(']') + 1);
            const parsedArray = JSON.parse(jsonArrayStr);
            const strPayload = parsedArray[1]; // This is a string containing HTML/React data
            
            // Now within strPayload, we can look for "zones":
            const zonesStart = strPayload.indexOf('"zones":[');
            const connStart = strPayload.indexOf('"connections":[');
            
            if (zonesStart > -1 && connStart > -1) {
                // Extract zones JSON array
                let braceCount = 0;
                let zonesEnd = -1;
                for (let i = zonesStart + 8; i < strPayload.length; i++) {
                    if (strPayload[i] === '[') braceCount++;
                    if (strPayload[i] === ']') {
                        braceCount--;
                        if (braceCount === 0) {
                            zonesEnd = i;
                            break;
                        }
                    }
                }
                
                // Extract connections JSON array
                let braceCount2 = 0;
                let connEnd = -1;
                for (let i = connStart + 14; i < strPayload.length; i++) {
                    if (strPayload[i] === '[') braceCount2++;
                    if (strPayload[i] === ']') {
                        braceCount2--;
                        if (braceCount2 === 0) {
                            connEnd = i;
                            break;
                        }
                    }
                }
                
                const zonesJson = strPayload.substring(zonesStart + 8, zonesEnd + 1);
                const connJson = strPayload.substring(connStart + 14, connEnd + 1);
                
                const zones = JSON.parse(zonesJson);
                const connections = JSON.parse(connJson);
                
                console.log("Zones count:", zones.length);
                console.log("Connections count:", connections.length);
                
                const mapGraph = {};
                connections.forEach(conn => {
                    const z1 = zones[conn[0]]?.name;
                    const z2 = zones[conn[1]]?.name;
                    if (z1 && z2) {
                        const uz1 = z1.toUpperCase();
                        const uz2 = z2.toUpperCase();
                        if (!mapGraph[uz1]) mapGraph[uz1] = [];
                        if (!mapGraph[uz2]) mapGraph[uz2] = [];
                        if (!mapGraph[uz1].includes(uz2)) mapGraph[uz1].push(uz2);
                        if (!mapGraph[uz2].includes(uz1)) mapGraph[uz2].push(uz1);
                    }
                });
                
                fs.writeFileSync("extracted_connections.json", JSON.stringify(mapGraph, null, 2));
                console.log("Written to extracted_connections.json");
                break;
            }
        } catch(e) {
            console.error("Error parsing line", e);
        }
    }
}
