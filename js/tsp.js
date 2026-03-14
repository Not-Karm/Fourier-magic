// Lightweight TSP approximation for single-stroke drawings.
// Uses multi-start nearest-neighbor followed by limited 2-opt cleanup.

function distSq(p1, p2) {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

function dist(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function pathLength(path, closePath = true) {
    if (!path || path.length <= 1) return 0;

    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        total += dist(path[i], path[i + 1]);
    }

    if (closePath) {
        total += dist(path[path.length - 1], path[0]);
    }

    return total;
}

function buildCandidateStarts(points, count) {
    if (points.length <= count) {
        return points.map((_, index) => index);
    }

    let sumX = 0;
    let sumY = 0;
    for (const point of points) {
        sumX += point.x;
        sumY += point.y;
    }

    const cx = sumX / points.length;
    const cy = sumY / points.length;
    const scored = points.map((point, index) => ({
        index,
        score: distSq(point, { x: cx, y: cy })
    }));

    scored.sort((a, b) => b.score - a.score);

    const selected = [];
    const step = Math.max(1, Math.floor(scored.length / count));
    for (let i = 0; i < scored.length && selected.length < count; i += step) {
        selected.push(scored[i].index);
    }

    if (!selected.includes(0)) selected.push(0);
    return selected.slice(0, count);
}

function buildNearestNeighborPath(points, startIndex) {
    const unvisited = points.slice();
    const start = unvisited.splice(startIndex, 1)[0];
    const path = [start];
    let current = start;

    while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
            const d = distSq(current, unvisited[i]);
            if (d < minDist) {
                minDist = d;
                nearestIdx = i;
            }
        }

        current = unvisited[nearestIdx];
        path.push(current);
        unvisited.splice(nearestIdx, 1);
    }

    return path;
}

function reverseSegment(path, start, end) {
    while (start < end) {
        const tmp = path[start];
        path[start] = path[end];
        path[end] = tmp;
        start++;
        end--;
    }
}

function improveWithTwoOpt(path, closePath = true, maxPasses = 2, neighborhood = 64) {
    const n = path.length;
    if (n < 4) return path;

    for (let pass = 0; pass < maxPasses; pass++) {
        let improved = false;

        for (let i = 0; i < n - 2; i++) {
            const a = path[i];
            const b = path[(i + 1) % n];
            const maxK = Math.min(n - 1, i + neighborhood);

            for (let k = i + 2; k <= maxK; k++) {
                if (!closePath && k === n - 1) continue;
                if (closePath && i === 0 && k === n - 1) continue;

                const c = path[k];
                const d = path[(k + 1) % n];
                const current = dist(a, b) + dist(c, d);
                const swapped = dist(a, c) + dist(b, d);

                if (swapped + 1e-6 < current) {
                    reverseSegment(path, i + 1, k);
                    improved = true;
                }
            }
        }

        if (!improved) break;
    }

    return path;
}

function solveTSP(points, options = {}) {
    if (!points || points.length <= 1) return points ? points.slice() : [];

    const closePath = options.closePath !== false;
    const candidateStarts = Math.max(1, options.candidateStarts || 6);
    const maxPasses = Math.max(0, options.maxPasses || 2);
    const neighborhood = Math.max(8, options.neighborhood || 64);

    const starts = buildCandidateStarts(points, candidateStarts);
    let bestPath = null;
    let bestLength = Infinity;

    for (const startIndex of starts) {
        const path = buildNearestNeighborPath(points, Math.min(startIndex, points.length - 1));
        const candidate = improveWithTwoOpt(path, closePath, maxPasses, neighborhood);
        const candidateLength = pathLength(candidate, closePath);

        if (candidateLength < bestLength) {
            bestLength = candidateLength;
            bestPath = candidate.slice();
        }
    }

    return bestPath || points.slice();
}
