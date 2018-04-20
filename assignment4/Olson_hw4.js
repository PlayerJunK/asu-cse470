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

var SHADER_PROGRAMS = {};
var scene;

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
  var cylinderGeo = surfaceOfRevolution(surfaceRevOptions.CYLINDER, blueGenerator, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);

  //HW470 create geometry for pot
  var potGeo = surfaceOfRevolution(surfaceRevOptions.MYSURFACE, blueGenerator, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);

  scene = new Scene(gl);
  scene.camera = new Camera(new Transform(0,0,-1), 65, canvas.width/canvas.height, 0.1, 50);

  let mat = new PhongMaterial(gl, {
    ambient: vec3(0.1, 0.1, 0.2),
    diffuse: vec3(0.6, 0.6, 0.8),
    specular: vec3(1,1,1),
    constants: new PhongConstants(1.0, 1.0, 0.6, 500)
  })
  let entity = new Entity(gl, potGeo, mat)

  scene.entities.push(entity)

  render();
}

window.onload = init

function render() {
  scene.draw(gl)
  // HW470: Get next availale frame and run this function again
  window.requestAnimationFrame(render);
}

