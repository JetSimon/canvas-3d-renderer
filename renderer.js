const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const f = 300;

let faces = [

];

let points = [
    [0,0,0],
    [1,0,0],
    [1,1,0],
    [0,1,0],
    [0,0,1],
    [1,0,1],
    [1,1,1],
    [0,1,1]
];

const intrinsic = [
    [f, 0, 0, 0],
    [0, f, 0, 0],
    [0, 0, 1, 0]
];

let drawVerts = true;
let drawZBuffer = false;

const txInput = document.getElementById("x");
const tyInput = document.getElementById("y");
const tzInput = document.getElementById("z");
txInput.value = 4;
tyInput.value = 2;
tzInput.value = 6;

const rxInput = document.getElementById("rx");
const ryInput = document.getElementById("ry");
const rzInput = document.getElementById("rz");

const lightXInput = document.getElementById("lx");
const lightYInput = document.getElementById("ly");
const lightZInput = document.getElementById("lz");
const lightSInput = document.getElementById("ls");

const shininessInput = document.getElementById("shininess");

function passesZBuffer(x,y,depth,zBuffer) {
    if(x < 0 || x >= zBuffer[0].length || y < 0 || y >= zBuffer.length) {
        return false;
    }

    if(depth <= zBuffer[y][x]) {
        zBuffer[y][x] = depth;
        return true;
    }

    return false;
}

let extrinsic = [
    [1,0,0,0],
    [0,1,0,0],
    [0,0,1,0],
    [0,0,0,1],
];

const SHADE_DEPTH = 0;
const SHADE_DIFFUSE = 1;
const SHADE_SPEC = 2;
const SHADE_DIFFUSE_SPEC = 3;

let shadingType = SHADE_DIFFUSE_SPEC;

function drawTriangleFrom3D(V1, V2, V3, ctx, cameraMatrix) {

    let v1 = project(cameraMatrix, V1);
    let v2 = project(cameraMatrix, V2);
    let v3 = project(cameraMatrix, V3);

    const V1d = distanceToCamera(V1[0], V1[1], V1[2]);
    const V2d = distanceToCamera(V2[0], V2[1], V2[2]);
    const V3d = distanceToCamera(V3[0], V3[1], V3[2]);

    ctx.fillStyle = '#F00';
    minX = Math.min(v1[0], v2[0], v3[0]);
    maxX = Math.max(v1[0], v2[0], v3[0]);
    minY = Math.min(v1[1], v2[1], v3[1]);
    maxY = Math.max(v1[1], v2[1], v3[1]);

    const normal = getNormalForFace(V1, V2, V3);

    for(let y = minY; y < maxY; y++) {
        for(let x = minX; x < maxX; x++) {

            [w1, w2, w3] = barycentricWeights([x,y], v1, v2, v3);
            let depth = w1 * V1d + w2 * V2d + w3 * V3d;
            let r,g,b;

            if(pointInTriangle([x,y], v1, v2, v3) && passesZBuffer(x,y,depth,zBuffer)) {
                if(shadingType == SHADE_DEPTH) {
                    [r,g,b] = getDepthBasedColor(x,y);
                    r *= 4;
                    g *= 4;
                    b *= 4;
                }
                else if(shadingType == SHADE_DIFFUSE) {
                    let X = w1 * V1[0] + w2 * V2[0] + w3 * V3[0];
                    let Y = w1 * V1[1] + w2 * V2[1] + w3 * V3[1];
                    let Z = w1 * V1[2] + w2 * V2[2] + w3 * V3[2];
                    [r,g,b] = getDiffuseColor(X, Y, Z, [255, 0, 0], normal);
                } 
                else if(shadingType == SHADE_SPEC) {
                    let X = w1 * V1[0] + w2 * V2[0] + w3 * V3[0];
                    let Y = w1 * V1[1] + w2 * V2[1] + w3 * V3[1];
                    let Z = w1 * V1[2] + w2 * V2[2] + w3 * V3[2];
                    [r,g,b] = getSpecColor(X, Y, Z, [255, 0, 0], normal);
                } 
                else if(shadingType == SHADE_DIFFUSE_SPEC) {
                    let X = w1 * V1[0] + w2 * V2[0] + w3 * V3[0];
                    let Y = w1 * V1[1] + w2 * V2[1] + w3 * V3[1];
                    let Z = w1 * V1[2] + w2 * V2[2] + w3 * V3[2];
                    [rd,gd,bd] = getDiffuseColor(X, Y, Z, [255, 0, 0], normal);
                    [rs,gs,bs] = getSpecColor(X, Y, Z, [255, 0, 0], normal);

                    r = rd + rs;
                    g = gd + gs;
                    b = bd + bs; 
                } 

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

let tx;
let ty;
let tz;
let light;
let lightStrength;
let shininess;

function distanceToCamera(X, Y, Z) {
    let total = 0;
    
    total += Math.pow(X - tx, 2);
    total += Math.pow(Y - ty, 2);
    total += Math.pow(Z - tz, 2);

    return Math.sqrt(total);
}

function getDepthBasedColor(x,y) {
    let val = zBuffer[y][x];
    val = val == Infinity || val == 0 ? 0 : 1 / val;
    return [255 * val, 255 * val, 255 * val];
}

function getDiffuseColor(X, Y, Z, color, normal) {

    let to_light = [light[0] - X, light[1] - Y, light[2] - Z];
    to_light = normalize(to_light);

    normal = normalize(normal);

    let angle = dot(to_light, normal);
    angle = angle.clamp(0, 1);
    let [r,g,b] = color;

    let lightDir = subVector([X,Y,Z], light);
    let distance = magnitude(lightDir);
    distance = distance * distance;

    return [lightStrength * r * angle / distance, lightStrength * g * angle / distance, lightStrength * b * angle / distance];
}

function getSpecColor(X, Y, Z, color, normal) {

    normal = normalize(normal);
    let lightDir = subVector([X,Y,Z], light);
    let distance = magnitude(lightDir);
    distance = distance * distance;
    lightDir = normalize(lightDir);

    let lambertian = Math.max(dot(lightDir, normal), 0.0);
    let specular = 0.0;

    if(lambertian > 0) {
        let viewDir = normalize([-X, -Y, -Z]);
        let halfDir = normalize(addVector(lightDir, viewDir));
        let specAngle = Math.max(dot(halfDir, normal), 0.0);
        specular = Math.pow(specAngle, shininess);
    }

    let [r,g,b] = color;
    return [lightStrength * r * specular / distance, lightStrength * g * specular / distance, lightStrength * b * specular / distance];
}

function renderFrame() {

    zBuffer = fillMatrix(canvas.width, canvas.height, Infinity);

    tx = Number(txInput.value);
    ty = Number(tyInput.value);
    tz = Number(tzInput.value);

    const rx = Number(rxInput.value);
    const ry = Number(ryInput.value);
    const rz = Number(rzInput.value);

    light = [lightXInput.value, lightYInput.value, lightZInput.value].filter((x) => Number(x));
    lightStrength = Number(lightSInput.value);
    shininess = Number(shininessInput.value);

    let extrinsic = [
        [1,0,0,tx],
        [0,1,0,ty],
        [0,0,1,tz],
        [0,0,0,1],
    ];

    extrinsic = applyRotations(rx,ry,rz,extrinsic);

    const cameraMatrix = matMul(intrinsic, extrinsic);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let face of faces) {
        let verts = face.map((idx) => points[idx - 1])
        drawTriangleFrom3D(verts[0], verts[1], verts[2], ctx, cameraMatrix);
    }

    if(drawVerts) {
        ctx.fillStyle = '#000';
        for(let point of points) {
            let [X,Y,Z] = point;
            let [x, y] = project(cameraMatrix, point);
    
    
            if(!passesZBuffer(x,y,distanceToCamera(X,Y,Z),zBuffer)) {
                continue;
            }
            
            if(!drawZBuffer) {
                ctx.fillRect(x, y, 1, 1);
            }
            
        }
    }

    if(drawZBuffer) {

        let highest = -Infinity;
        let lowest = Infinity;
        for(let y = 0; y < canvas.height; y++) {
            for(let x = 0; x < canvas.width; x++) {
                let val = zBuffer[y][x];

                highest = Math.max(val, highest);

                if(val == -Infinity) {
                    continue;
                } 

                lowest = Math.min(val, lowest);
            }
        }

        for(let y = 0; y < canvas.height; y++) {
            for(let x = 0; x < canvas.width; x++) {
                let [r,g,b] = getDepthBasedColor(x,y);

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

setInterval(renderFrame, 1000/24);
