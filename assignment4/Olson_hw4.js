// Gray Olson
// CSE 470
var canvas;
var gl;

// HW470: Setup uniform locations and other globals need to be here so that we can use them in render as well
var cubeInstances = [];
var xAxis = vec3(1, 0, 0);
var yAxis = vec3(0, 1, 0);
var zAxis = vec3(0, 0, 1);
var rotationAxis = xAxis;
var uModelViewLoc, uProjectionLoc;
var staticData = {
  vertices: [],
  colors: []
};

var SHADER_PROGRAMS;

// HW470: Function to multiply a 4d matrix with a 4d vector
function mult4(mat, vec) {
  var result = [];
  for (var i = 0; i < vec.length; ++i) {
    var innerSum = 0;
    for (var j = 0; j < mat[i].length; ++j) {
      innerSum += vec[i] * mat[i][j];
    }
    result.push(innerSum);
  }
  return result;
}

function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.12, 0.1, 0.15, 1.0);
  gl.enable(gl.DEPTH_TEST);

  SHADER_PROGRAMS.BASIC = initShaders(gl, "vertex-basic", "fragment-basic");
  SHADER_PROGRAMS.PHONG = initShaders(gl, "vertex-phong", "fragment-phong");
  SHADER_PROGRAMS.GOURAD = initShaders(gl, "vertex-gourad", "fragment-basic");

  //HW470 Create the geometry for cylinder
  var cylinderGeo = geometry(surfaceRevOptions.CYLINDER, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);

  //HW470 create geometry for pot
  var potGeo = geometry(surfaceRevOptions.MYSURFACE, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);

  // HW470: initialize and set up uniform locations
  uProjLoc = gl.getUniformLocation(program, "uProjection");
  uModelViewLoc = gl.getUniformLocation(program, "uModelView");
  // HW470: Setup ortho projection matrix based on canvas aspect ratio
  var aspect = canvas.width / canvas.height;
  var proj = ortho(-1 * aspect, 1 * aspect, -1, 1, -10, 10);
  // HW470: Create inverse projection for use later
  var inverseProj = inverse4(proj);
  // HW470: Setup initial cube's model matrix
  // HW470: Send initial data to uniforms
  gl.uniformMatrix4fv(uProjLoc, false, flatten(proj));
  gl.uniformMatrix4fv(uModelViewLoc, false, flatten(cubeInstances[0].transform.getTransform()));

  // HW470: Setup click event
  canvas.onclick = (e) => {
    // HW470: First get canvas-relative pixel coordinates of the click
    var screenx = e.pageX - canvas.offsetLeft;
    var screeny = canvas.height - (e.pageY - canvas.offsetTop);
    // HW470: then normalize them to OGL -1, 1 space
    var normx = 2 * (screenx / canvas.width) - 1;
    var normy = 2 * (screeny / canvas.height) - 1;
    // HW470: Unproject normalized coordinates using inverse projection matrix
    var projected = mult4(inverseProj, vec4(normx, normy, 0, 1));
    // HW470: Randomize z from -0.5, 0.5
    projected[2] = Math.random() - 0.5;
    // HW470: Add new cube instance
    addCube({
      transform: new Transform(projected[0], projected[1], projected[2]),
      // HW470: Random speed between -1 and 1
      speed: Math.random() * 2 - 1
    })

  }

  // HW470: Setup rotation buttons
  document.getElementById('rotatex').onclick = e => {
    rotationAxis = xAxis
  }
  document.getElementById('rotatey').onclick = e => {
    rotationAxis = yAxis
  }
  document.getElementById('rotatez').onclick = e => {
    rotationAxis = zAxis
  }
  document.getElementById('rotaterand').onclick = e => {
    rotationAxis = vec3(Math.random(), Math.random(), Math.random())
  }

  // HW470: Start render loop
  render();
}

window.onload = init

function render() {
  // HW470 clear color and depth buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // HW470 Draw each cube instance
  cubeInstances.forEach(cube => {
    // HW470: First we rotate this cube around the rotation axis by its speed
    cube.transform.rotate(cube.speed, rotationAxis);
    // HW470: Then recompute the transform matrix
    cube.transform.computeTransform();
    // HW470: Send the new data to the gpu in the modelview uniform
    gl.uniformMatrix4fv(uModelViewLoc, false, flatten(cube.transform.getTransform()));
    // HW470: Draw the static verticies transformed by the matrix
    gl.drawArrays(gl.TRIANGLES, 0, staticData.vertices.length);
  })
  // HW470: Get next availale frame and run this function again
  window.requestAnimationFrame(render);
}

