// Gray Olson
//

// HW470: Holds data about geometry and knows how to describe and send it to the GPU
function Geometry(positions, colors, normals, texCoords, indices) {
  this.positions = positions
  this.colors = colors
  this.normals = normals
  this.texCoords = texCoords
  this.indices = indices
  this.initialized = false
}

// HW470: Sets up buffers for each piece of data on the GPU
Geometry.prototype.initGL = function (gl) {
  if (!this.initialized) {
    this.buffers = {
      position: gl.createBuffer(),
      color: gl.createBuffer(),
      normal: gl.createBuffer(),
      texCoord: gl.createBuffer(),
      index: gl.createBuffer()
    }
  }
  this.sendData(gl)
}

// HW470: Sends the data that this instance contains to the GPU
Geometry.prototype.sendData = function (gl) {
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(this.positions), gl.STATIC_DRAW)

  if (typeof this.colors !== 'undefined') {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW)
  }

  if (typeof this.normals !== 'undefined') {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normal)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW)
  }

  if (typeof this.texCoords !== 'undefined') {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texCoord)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texCoords), gl.STATIC_DRAW)
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(this.indices)), gl.STATIC_DRAW)
}

// HW470: Binds the shader attribute state to the correct buffers/descriptions for this geometry
Geometry.prototype.enableAttributes = function (gl, locs) {
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position)
  gl.vertexAttribPointer(locs.position, 4, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(locs.position)

  if (locs.color !== -1) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color)
    gl.vertexAttribPointer(locs.color, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(locs.color)
  }

  if (locs.normal !== -1) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normal)
    gl.vertexAttribPointer(locs.normal, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(locs.normal)
  }

  if (locs.texCoord !== -1) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texCoord)
    gl.vertexAttribPointer(locs.texCoord, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(locs.texCoord)
  }
}

// Surface of revolutions to choose from
// input params go in call to makeSurfRev
var surfaceRevOptions = 
  {
    tessGenDir: 30,
    tessRotDir: 30,

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

function blueGenerator(t, s) {
  return vec4(0.3, 0.3, 0.8, 1.0)
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
function surfaceOfRevolution(surfaceGenerator, colorGenerator, tesselationFnDir, tesselationRotDir) {
  let vertices = [];
  let normals = [];
  let colors = [];
  let texCoords = [];
  let normalDrawVerts = [];
  let indices = [];
  let wireIndices = [];
  let numTris = 0;
  let maxZ = 0;
  for (let t = 1; t >= -1.01; t -= 2 / (tesselationFnDir)) {
    let gen = surfaceGenerator.curve(t);
    maxZ = Math.max(maxZ, gen);
    const baseVec = vec4(gen, t, 0, 1);
    for (let theta = 0; theta <= 360; theta += 360 / tesselationRotDir) {
      const rot = rotateY(theta)
      let vert = multMatVec(rot, baseVec);
      let slope = surfaceGenerator.derivative(t);
      const norm = normalize(vec4(Math.cos(radians(theta)), -slope, Math.sin(radians(theta)), 0), true);
      vertices.push(vert);
      normals.push(norm);
      colors.push(colorGenerator(theta, t));
      let ss = theta/360 * 2 * Math.PI
      let tt = (t + 1) / 2
      texCoords.push(vec2(ss * 2, tt * 2));
      normalDrawVerts.push(vert);
      normalDrawVerts.push(add(vert, scale(0.1, norm)));
    }
  }
  // 0 = top left,
  // 1 = top right,
  // 2 = bottom left,
  // 3 = botom right
  const subIndices = [0,1,2,2,1,3];
  const wireSubIndices = [1,0,0,2,2,1,1,3,3,2];
  for (let i = 0; i < tesselationFnDir; i++) {
    for (let j = 0; j < tesselationRotDir; j++) {
      let quadIndices = [
        (tesselationRotDir + 1) * (i) + j, (tesselationRotDir + 1) * (i) + (j + 1),
        (tesselationRotDir + 1) * (i + 1) + j, (tesselationRotDir + 1) * (i+1) + (j + 1)
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
  return new Geometry(vertices, colors, normals, texCoords, indices)
}

// HW470: Create geometry of a plane
function planeY(w,l,texRepeat) {
  let vertices = [
    vec4(-w/2, 0, l/2, 1), vec4(w/2, 0, l/2, 1),
    vec4(-w/2, 0, -l/2, 1), vec4(w/2, 0, -l/2, 1)
  ]
  let normals = [vec4(0, 1, 0, 0), vec4(0, 1, 0, 0), vec4(0, 1, 0, 0), vec4(0, 1, 0, 0)]
  let colors = [vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0)]
  let texCoords = [
    vec2(0, texRepeat), vec2(texRepeat * w/l, texRepeat),
    vec2(0, 0), vec2(texRepeat * w/l, 0)
  ]
  let indices = [0,1,2,2,1,3];
  return new Geometry(vertices, colors, normals, texCoords, indices)
}

// HW470: Create geometry of a cube with separate vertices/normals/texture coordinates for each face
function cube(w, l, h, texRepeat) {
  let vertices = [
    // top face
    vec4(-w/2, h/2, l/2, 1), vec4(w/2, h/2, l/2, 1),
    vec4(-w/2, h/2, -l/2, 1), vec4(w/2, h/2, -l/2, 1),
    // bottom face
    vec4(-w/2, -h/2, l/2, 1), vec4(w/2, -h/2, l/2, 1),
    vec4(-w/2, -h/2, -l/2, 1), vec4(w/2, -h/2, -l/2, 1),
    // left face
    vec4(-w/2, h/2, l/2, 1), vec4(-w/2, h/2, -l/2, 1),
    vec4(-w/2, -h/2, l/2, 1), vec4(-w/2, -h/2, -l/2, 1),
    // right face
    vec4(w/2, h/2, l/2, 1), vec4(w/2, h/2, -l/2, 1),
    vec4(w/2, -h/2, l/2, 1), vec4(w/2, -h/2, -l/2, 1),
    // front face
    vec4(-w/2, h/2, l/2, 1), vec4(w/2, h/2, l/2, 1),
    vec4(-w/2, -h/2, l/2, 1), vec4(w/2, -h/2, l/2, 1),
    // back face
    vec4(-w/2, h/2, -l/2, 1), vec4(w/2, h/2, -l/2, 1),
    vec4(-w/2, -h/2, -l/2, 1), vec4(w/2, -h/2, -l/2, 1),
  ]
  let normals = [
    vec4(0, 1, 0, 0), vec4(0, 1, 0, 0), vec4(0, 1, 0, 0), vec4(0, 1, 0, 0),
    vec4(0, -1, 0, 0), vec4(0, -1, 0, 0), vec4(0, -1, 0, 0), vec4(0, -1, 0, 0),
    vec4(-1, 0, 0, 0), vec4(-1, 0, 0, 0), vec4(-1, 0, 0, 0), vec4(-1, 0, 0, 0),
    vec4(1, 0, 0, 0), vec4(1, 0, 0, 0), vec4(1, 0, 0, 0), vec4(1, 0, 0, 0),
    vec4(0, 0, 1, 0), vec4(0, 0, 1, 0), vec4(0, 0, 1, 0), vec4(0, 0, 1, 0),
    vec4(0, 0, -1, 0), vec4(0, 0, -1, 0), vec4(0, 0, -1, 0), vec4(0, 0, -1, 0)
  ]
  let colors = [
    vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0),
    vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0),
    vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0),
    vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0),
    vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0),
    vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 1.0),
  ]
  let texCoords = [
    vec2(0, texRepeat), vec2(texRepeat * w/l, texRepeat),
    vec2(0, 0), vec2(texRepeat * w/l, 0),
    vec2(0, texRepeat), vec2(texRepeat * w/l, texRepeat),
    vec2(0, 0), vec2(texRepeat * w/l, 0),
    vec2(0, texRepeat), vec2(texRepeat * l/h, texRepeat),
    vec2(0, 0), vec2(texRepeat * l/h, 0),
    vec2(0, texRepeat), vec2(texRepeat * l/h, texRepeat),
    vec2(0, 0), vec2(texRepeat * l/h, 0),
    vec2(0, texRepeat), vec2(texRepeat * w/h, texRepeat),
    vec2(0, 0), vec2(texRepeat * w/h, 0),
    vec2(0, texRepeat), vec2(texRepeat * w/h, texRepeat),
    vec2(0, 0), vec2(texRepeat * w/h, 0)
  ]
  let indices = []
  for (let i = 0; i < 6; i++) {
    indices.push(0 + i * 4)
    indices.push(1 + i * 4)
    indices.push(2 + i * 4)
    indices.push(2 + i * 4)
    indices.push(1 + i * 4)
    indices.push(3 + i * 4)
  }
  return new Geometry(vertices, colors, normals, texCoords, indices)
}
