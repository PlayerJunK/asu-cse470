// Gray Olson
//

// Surface of revolutions to choose from
// input params go in call to makeSurfRev
var surfaceRevOptions = 
  {
    tessGenDir: 40,
    tessRotDir: 80,

    inputChoice: 0,	
    // HW470: Each of these is an object, the structure is explained below
    // (the surfaceGenerator argument to geometry)
    CYLINDER: { curve: cylinderCurve, derivative: cylinderDerivative },
    MYSURFACE: { curve: potCurve, derivative: potDerivative },
    MYSURFACE2: { curve: pot2Curve, derivative: pot2Derivative }
  }

// HW470: Custom function for SoR
function potCurve(t) {
  return 0.25 * Math.sin(-1 * t*Math.PI) + 0.5
}

// HW470: Derivative of said custom function
function potDerivative(t) {
  return -Math.PI / 4 * Math.cos(Math.PI * t)
}

function pot2Curve(t) {

  return Math.sin(-1 * t*Math.PI) / 8 + Math.sin(t*2*Math.PI + Math.PI) / 4 + 0.5
}

function pot2Derivative(t) {
  return -Math.PI / 8 * (Math.cos(Math.PI * t) + 4 * Math.cos(2*Math.PI*t))
}

// HW470: Cylinder generator function
function cylinderCurve(t) {
  return 1
}

// HW470: Cylinder derivative function
function cylinderDerivative(t) {
  return 0
}

// HW 470: function to multiply a matrix and vector for transformation
function multMatVec(u, v) {
  for ( var i = 0; i < u.length; ++i ) {
      if ( u[i].length != v.length ) {
          throw "mult(): trying to add matrices of different dimensions";
      }
  }

  let result = [];
  for ( var i = 0; i < u.length; ++i ) {
    let sum = 0;
    for ( var j = 0; j < u[i].length; ++j ) {
      sum += u[i][j] * v[j];
    }
    result.push( sum );
  }

  return result;
}

// HW470:
// ===================================
// ======= Geometry Creation =========
// ===================================
// surfaceGenerator is an object containing two functions: curve and derivative
// curve generates g(t) (the curve) and derivative generates g'(t) (to calculate
// normal)
function geometry(surfaceGenerator, tesselationFnDir, tesselationRotDir) {
  let vertices = [];
  let normals = [];
  let normalDrawVerts = [];
  let indices = [];
  let wireIndices = [];
  let numTris = 0;
  let maxZ = 0;
  for (let t = 1; t >= -1.01; t -= 2 / (tesselationFnDir)) {
    let gen = surfaceGenerator.curve(t);
    maxZ = Math.max(maxZ, gen);
    const baseVec = vec4(gen, t, 0, 1);
    for (let theta = 0; theta < 360; theta += 360 / tesselationRotDir) {
      const rot = rotateY(theta)
      let vert = multMatVec(rot, baseVec);
      let slope = surfaceGenerator.derivative(t);
      const norm = normalize(vec4(Math.cos(radians(theta)), -slope, Math.sin(radians(theta)), 0), true);
      vertices.push(vert);
      normals.push(norm);
      normalDrawVerts.push(vert);
      normalDrawVerts.push(add(vert, scale(0.1, norm)));
    }
  }
  // 0 = top left,
  // 1 = top right,
  // 2 = bottom left,
  // 3 = botom right
  const subIndices = [1,0,2,2,1,3];
  const wireSubIndices = [1,0,0,2,2,1,1,3,3,2];
  for (let i = 0; i < tesselationFnDir; i++) {
    for (let j = 0; j < tesselationRotDir; j++) {
      let quadIndices = [
        (tesselationRotDir) * (i) + j, (tesselationRotDir) * (i) + (j + 1) % tesselationRotDir,
        (tesselationRotDir) * (i + 1) + j, (tesselationRotDir) * (i+1) + (j + 1) % tesselationRotDir
      ];
      for (let k = 0; k < wireSubIndices.length; k++) {
        wireIndices.push(quadIndices[wireSubIndices[k]])
      }
      for (let k = 0; k < subIndices.length; k++) {
        indices.push(quadIndices[subIndices[k]])
      }
      numTris += 2;
    }
  }
  return {
    vertices,
    normals,
    normalDrawVerts,
    indices,
    wireIndices,
    numTris,
    maxZ
  }
}
