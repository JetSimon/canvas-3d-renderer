function fillMatrix(rows, columns, x) {
    let res = [];

    for(let i = 0; i < rows; i++) {
        let row = [];
        for(let j = 0; j < columns; j++) {
            row.push(x);
        }
        res.push(row);
    }

    return res;
}

function zeros(rows, columns) {
    return fillMatrix(rows, columns, 0);
}

function matMul(A, B) {

    let flattened = false;
    if (B[0].length == null) {
        flattened = true;
        let C = [];
        for(let i = 0; i < B.length; i++) {
            C.push([B[i]]);
        }
        B = C;
    }

    const m = A.length;
    const n = A[0]?.length ?? 1;
    const p = B[0].length ?? 1;
    const q = B.length;

    if(n != q) {
        console.error(`Dimensions ${n}, ${q} not equal`);
        return null;
    }

    let res = zeros(m,p);

    for(let i = 0; i < m; i++) {
        for(let k = 0; k < p; k++) {
            let total = 0;
            for(let j = 0; j < n; j++) {
                total += A[i][j] * B[j][k];
            }
            res[i][k] = total;
        }
    }

    if(flattened) {
        let C = [];
        for(let i = 0; i < res.length; i++) {
            C.push(res[i][0]);
        }
        res = C;
    }

    return res;
}

function project(P, point) {
    const X = point[0];
    const Y = point[1];
    const Z = point[2];

    const res = matMul(P, [X,Y,Z,1]);

    return [Math.round(res[0] / res[2]), Math.round(res[1] / res[2])];
}

function applyRotations(rx,ry,rz,matrix) {

    rx *= Math.PI / 180;
    ry *= Math.PI / 180;
    rz *= Math.PI / 180;

    const RX = [
        [1, 0, 0],
        [0, Math.cos(rx), -Math.sin(rx)],
        [0, Math.sin(rx), Math.cos(rx)]
    ];

    const RY = [
        [Math.cos(ry), 0, Math.sin(ry)],
        [0, 1, 0],
        [-Math.sin(ry), 0, Math.cos(ry)]
    ];

    const RZ = [
        [Math.cos(rz), -Math.sin(rz), 0],
        [Math.sin(rz),  Math.cos(rz), 0],
        [0, 0, 1]
    ];

    let R = matMul(RX, RY);
    R = matMul(R, RZ);

    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 3; j++) {
            matrix[i][j] = R[i][j];
        }
    }

    return matrix;
}

function getNormalForFace(V1, V2, V3) {
    return normalize(cross(subVector(V3, V2), subVector(V3, V1)));
}

// Subtract V1 from V2
// V2 - V1
function subVector(V1, V2) {
    let res = [];
    for(let i = 0; i < V1.length; i++) {
        res.push(V2[i] - V1[i]);
    }
    return res;
}

function addVector(V1, V2) {
    let res = [];
    for(let i = 0; i < V1.length; i++) {
        res.push(V2[i] + V1[i]);
    }
    return res;
}

function cross(vect_A, vect_B) {
    let cross_P = [0,0,0];
    cross_P[0] = vect_A[1] * vect_B[2]
                     - vect_A[2] * vect_B[1];
    cross_P[1] = vect_A[2] * vect_B[0]
                    - vect_A[0] * vect_B[2];
    cross_P[2] = vect_A[0] * vect_B[1]
                    - vect_A[1] * vect_B[0];
    return cross_P;
}

function sign(p1, p2, p3) {
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}

function magnitude(v) { 
    mag = 0;
    for(let i = 0; i < v.length; i++) {
        mag += Math.pow(v[i], 2);
    }
    mag = Math.sqrt(mag);
    return mag;
}

function normalize(v) {
    let mag = magnitude(v);
    res = [];

    for(let i = 0; i < v.length; i++) {
        res.push(v[i] / mag);
    }

    return res;
}

function pointInTriangle(pt, v1, v2, v3) {
    const d1 = sign(pt, v1, v2);
    const d2 = sign(pt, v2, v3);
    const d3 = sign(pt, v3, v1);

    const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(has_neg && has_pos);
}

function barycentricWeights(pt, v1, v2, v3) {
    const denom =  ((v2[1] - v3[1]) * (v1[0] - v3[0]) + (v3[0] - v2[0]) * (v1[1] - v3[1]));
    w1 = ((v2[1] - v3[1]) * (pt[0] - v3[0]) + (v3[0] - v2[0]) * (pt[1] - v3[1])) / denom;
    w2 = ((v3[1] - v1[1]) * (pt[0] - v3[0]) + (v1[0] - v3[0]) * (pt[1] - v3[1])) / denom;
    w3 = 1 - w1 - w2
    return [w1, w2, w3]
}

function dot(v0, v1) {
    return v0[0] * v1[0]  +  v0[1] * v1[1]  +  v0[2] * v1[2];
}

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};