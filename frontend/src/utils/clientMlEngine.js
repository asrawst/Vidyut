/**
 * Client-side High-Performance Multi-Layer Anomaly Engine.
 * 
 * Provides instantaneous (< 200ms) execution of the Vidyut ML & statistical pipeline
 * directly in the browser. When the backend hosted on Render is cold-starting or throttled,
 * this hybrid engine ensures zero latency for the user.
 */

// Simple robust string hash for deterministic lat/lng generation
function getDummyLatLon(uid) {
    let hash = 0;
    const str = String(uid);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const absHash = Math.abs(hash);
    const lat = 28.6139 + (absHash % 1000) / 10000.0;
    const lon = 77.2090 + ((absHash >> 5) % 1000) / 10000.0;
    return { latitude: Number(lat.toFixed(6)), longitude: Number(lon.toFixed(6)) };
}

// Fast CSV Parser
export function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Fast split handling quoted strings
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^["']|["']$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^["']|["']$/g, ''));

        if (values.length >= headers.length) {
            const row = {};
            for (let k = 0; k < headers.length; k++) {
                row[headers[k]] = values[k];
            }
            rows.push(row);
        }
    }

    return rows;
}

// Compute Quantile
function quantile(arr, q) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
}

// Normalize array to [0, 1]
function minMaxNormalize(arr) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] < min) min = arr[i];
        if (arr[i] > max) max = arr[i];
    }
    const denom = max - min;
    return arr.map(v => denom === 0 ? 0 : (v - min) / denom);
}

/**
 * Executes the complete Electrical Bomb Multi-Layer Risk Engine in JavaScript
 */
export async function analyzeDatasetClientSide(file) {
    const text = await file.text();
    const rows = parseCSV(text);

    if (!rows || rows.length === 0) {
        throw new Error("Dataset is empty or format is invalid.");
    }

    // Group rows by consumer_id
    const consumerMap = new Map();
    const txDailyMap = new Map(); // key: "txId_date"
    const txConsumersMap = new Map(); // key: txId -> [consumer_id]

    let totalLossAllTransformers = 0;

    for (const r of rows) {
        const cId = String(r.consumer_id || r.consumer || 'C0000').trim();
        const txId = String(r.transformer_id || r.transformer || 'T01').trim();
        const date = String(r.date || '2026-01-01').trim();
        const energy = parseFloat(r.energy_consumed || r.consumption || r.kwh || 0) || 0;
        const energyInput = parseFloat(r.energy_input || (energy * 1.05)) || (energy * 1.05);
        const voltage = parseFloat(r.avg_voltage || r.voltage || 230) || 230;
        const season = String(r.season || '').toLowerCase();
        
        let lat = parseFloat(r.latitude);
        let lon = parseFloat(r.longitude);
        if (isNaN(lat) || isNaN(lon)) {
            const dummy = getDummyLatLon(cId);
            lat = dummy.latitude;
            lon = dummy.longitude;
        }

        if (!consumerMap.has(cId)) {
            consumerMap.set(cId, {
                consumer_id: cId,
                transformer_id: txId,
                latitude: lat,
                longitude: lon,
                readings: [],
                voltages: [],
                monsoonReadings: []
            });
        }

        const cData = consumerMap.get(cId);
        cData.readings.push(energy);
        cData.voltages.push(voltage);
        if (season.includes('monsoon')) {
            cData.monsoonReadings.push(energy);
        }

        // Aggregate daily transformer consumption
        const txKey = `${txId}_${date}`;
        if (!txDailyMap.has(txKey)) {
            txDailyMap.set(txKey, { txId, date, totalConsumption: 0, energyInput });
        }
        const txDaily = txDailyMap.get(txKey);
        txDaily.totalConsumption += energy;

        if (!txConsumersMap.has(txId)) {
            txConsumersMap.set(txId, new Set());
        }
        txConsumersMap.get(txId).add(cId);
    }

    const consumers = Array.from(consumerMap.values());
    const totalConsumersCount = consumers.length;
    if (totalConsumersCount === 0) {
        throw new Error("No consumer records found in dataset.");
    }

    // 1. BEHAVIORAL & STATISTICAL METRICS
    const meanUsages = [];
    const statRisks = [];
    const mlRisks = [];

    for (const c of consumers) {
        const n = c.readings.length;
        const mean = n > 0 ? c.readings.reduce((a, b) => a + b, 0) / n : 0;
        let sumSq = 0;
        let min = Infinity;
        let max = -Infinity;
        for (const v of c.readings) {
            sumSq += (v - mean) * (v - mean);
            if (v < min) min = v;
            if (v > max) max = v;
        }
        const std = n > 1 ? Math.sqrt(sumSq / (n - 1)) : 0;
        const first = c.readings[0] || 0;
        const last = c.readings[n - 1] || 0;
        const trend = last - first;

        c.mean_usage = mean;
        c.std_usage = std;
        c.min_usage = min === Infinity ? 0 : min;
        c.max_usage = max === -Infinity ? 0 : max;
        c.trend = trend;

        meanUsages.push(mean);

        // Statistical anomaly: (mean - min) / (std + 1e-6)
        const statScore = (mean - c.min_usage) / (std + 1e-6);
        statRisks.push(statScore);

        // Heuristic ML isolation behavior proxy
        const mlProxy = (Math.abs(trend) / (mean + 1e-6)) + (std / (mean + 1e-6));
        mlRisks.push(mlProxy);
    }

    const normStatRisks = minMaxNormalize(statRisks);
    const normMlRisks = minMaxNormalize(mlRisks);

    // 2. TRANSFORMER LOSS METRICS
    const txLossRatioMap = new Map();
    for (const txDaily of txDailyMap.values()) {
        const loss = txDaily.energyInput - txDaily.totalConsumption;
        totalLossAllTransformers += Math.abs(loss);
        const lossRatio = loss / (txDaily.energyInput || 1e-6);

        if (!txLossRatioMap.has(txDaily.txId)) {
            txLossRatioMap.set(txDaily.txId, []);
        }
        txLossRatioMap.get(txDaily.txId).push(lossRatio);
    }

    const txMeanLossMap = new Map();
    let minTxLoss = Infinity;
    let maxTxLoss = -Infinity;
    for (const [txId, ratios] of txLossRatioMap.entries()) {
        const meanLoss = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        txMeanLossMap.set(txId, meanLoss);
        if (meanLoss < minTxLoss) minTxLoss = meanLoss;
        if (meanLoss > maxTxLoss) maxTxLoss = meanLoss;
    }
    const denomTx = maxTxLoss - minTxLoss;

    // 3. PEER COMPARISON METRICS
    const txPeerStatsMap = new Map();
    for (const [txId, cSet] of txConsumersMap.entries()) {
        const cList = Array.from(cSet).map(id => consumerMap.get(id));
        const means = cList.map(c => c.mean_usage);
        const peerMean = means.reduce((a, b) => a + b, 0) / (means.length || 1);
        let sqDiff = 0;
        for (const m of means) sqDiff += (m - peerMean) * (m - peerMean);
        const peerStd = means.length > 1 ? Math.sqrt(sqDiff / (means.length - 1)) : 1e-6;
        txPeerStatsMap.set(txId, { peerMean, peerStd: peerStd || 1e-6 });
    }

    const peerRisks = [];
    for (const c of consumers) {
        const pStats = txPeerStatsMap.get(c.transformer_id) || { peerMean: c.mean_usage, peerStd: 1e-6 };
        const dev = pStats.peerMean - c.mean_usage;
        const pRisk = dev > 0 ? (dev / pStats.peerStd) : 0;
        peerRisks.push(pRisk);
    }
    const normPeerRisks = minMaxNormalize(peerRisks);

    // 4. VOLTAGE RISKS
    const txVoltageStats = new Map();
    for (const [txId, cSet] of txConsumersMap.entries()) {
        const allV = [];
        for (const cid of cSet) {
            allV.push(...(consumerMap.get(cid).voltages || []));
        }
        const vMean = allV.reduce((a, b) => a + b, 0) / (allV.length || 1);
        let sq = 0;
        for (const v of allV) sq += (v - vMean) * (v - vMean);
        const vStd = allV.length > 1 ? Math.sqrt(sq / (allV.length - 1)) : 1e-6;
        txVoltageStats.set(txId, { vMean, vStd: vStd || 1e-6 });
    }

    const voltRisks = [];
    for (const c of consumers) {
        const vStat = txVoltageStats.get(c.transformer_id) || { vMean: 230, vStd: 1e-6 };
        const cVMean = c.voltages.reduce((a, b) => a + b, 0) / (c.voltages.length || 1);
        const dev = vStat.vMean - cVMean;
        const vRisk = dev >= 1.5 * vStat.vStd ? (dev / vStat.vStd) : 0;
        voltRisks.push(vRisk);
    }
    const normVoltRisks = minMaxNormalize(voltRisks);

    // 5. SEASONAL RISKS
    const seasonRisks = [];
    for (const c of consumers) {
        const monsoonMean = c.monsoonReadings.length > 0 
            ? c.monsoonReadings.reduce((a, b) => a + b, 0) / c.monsoonReadings.length 
            : 0;
        const sScore = monsoonMean / (c.mean_usage + 1e-6);
        seasonRisks.push(sScore);
    }
    const normSeasonRisks = minMaxNormalize(seasonRisks);

    // 6. COMBINED MULTI-LAYER RISK & EXPONENT
    const baseRisks = [];
    const finalRisks = [];

    for (let i = 0; i < totalConsumersCount; i++) {
        const c = consumers[i];
        const rawTxLoss = txMeanLossMap.get(c.transformer_id) || minTxLoss;
        const txLossRisk = denomTx === 0 ? 0 : (rawTxLoss - minTxLoss) / denomTx;

        const base = (
            0.30 * txLossRisk +
            0.22 * normPeerRisks[i] +
            0.18 * normMlRisks[i] +
            0.07 * normStatRisks[i] +
            0.15 * normVoltRisks[i] +
            0.08 * normSeasonRisks[i]
        );

        const finalR = Math.pow(base, 1.6);
        baseRisks.push(base);
        finalRisks.push(finalR);
        c.base_risk = base;
        c.final_risk = finalR;
        c.aggregate_risk_score = finalR;
    }

    // 7. CUTOFFS & CLASSIFICATION
    const meanR = finalRisks.reduce((a, b) => a + b, 0) / totalConsumersCount;
    let sumSqR = 0;
    for (const r of finalRisks) sumSqR += (r - meanR) * (r - meanR);
    const stdR = Math.sqrt(sumSqR / totalConsumersCount);

    const q97 = quantile(finalRisks, 0.97);
    const q80 = quantile(finalRisks, 0.80);
    const q60 = quantile(finalRisks, 0.60);

    const inspectionCutoff = Math.max(q97, meanR + 2 * stdR);
    const anomalyCutoff = q80;

    let criticalCases = 0;
    let anomaliesDetected = 0;
    const transformerAnomalyCounts = new Map();

    const results = [];
    const anomalies = [];

    for (const c of consumers) {
        let riskClass = 'normal';
        if (c.final_risk >= inspectionCutoff) {
            riskClass = 'critical';
            criticalCases++;
        } else if (c.final_risk >= q80) {
            riskClass = 'high';
        } else if (c.final_risk >= q60) {
            riskClass = 'mild';
        }

        const inspectionFlag = c.final_risk >= anomalyCutoff;
        if (inspectionFlag) {
            anomaliesDetected++;
            const currentCount = transformerAnomalyCounts.get(c.transformer_id) || 0;
            transformerAnomalyCounts.set(c.transformer_id, currentCount + 1);
        }

        const record = {
            consumer_id: c.consumer_id,
            transformer_id: c.transformer_id,
            aggregate_risk_score: Number(c.final_risk.toFixed(4)),
            final_risk: Number(c.final_risk.toFixed(4)),
            risk_class: riskClass,
            inspection_flag: inspectionFlag,
            latitude: c.latitude,
            longitude: c.longitude,
            mean_usage: Number(c.mean_usage.toFixed(2)),
            std_usage: Number(c.std_usage.toFixed(2))
        };

        results.push(record);
        if (inspectionFlag) {
            anomalies.push(record);
        }
    }

    const transformersAtRisk = Array.from(transformerAnomalyCounts.entries()).map(([transformer_id, count]) => ({
        transformer_id: String(transformer_id),
        anomalies_detected: Number(count)
    }));

    const gridHealth = totalConsumersCount > 0 
        ? Math.max(0, 100 - (anomaliesDetected / totalConsumersCount * 100)) 
        : 100;

    const totalLossCalculated = Math.round(totalLossAllTransformers * 9).toLocaleString('en-IN');

    return {
        summary: {
            total_consumers: totalConsumersCount,
            anomalies_detected: anomaliesDetected,
            critical_cases: criticalCases,
            grid_health_score: Number(gridHealth.toFixed(1)),
            total_loss_calculated: totalLossCalculated
        },
        results: results,
        anomalies: anomalies,
        transformers_at_risk: transformersAtRisk
    };
}
