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

var frames = 0;

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

function createShaderProgram(gl, vShader, fragShader, uniformNames) {
  let program = initShaders(gl, vShader, fragShader)
  gl.useProgram(program)
  program.locs = {}
  uniformNames.forEach(name => {
    program.locs[name] = gl.getUniformLocation(program, name)
  })
  program.locs.position = gl.getAttribLocation(program, 'a_vertexPosition')
  program.locs.color = gl.getAttribLocation(program, 'a_vertexColor')
  program.locs.normal = gl.getAttribLocation(program, 'a_vertexNormal')
  program.locs.texCoord = gl.getAttribLocation(program, 'a_texCoord')
  return program
}

function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.width, canvas.height);

  SHADER_PROGRAMS.BASIC = createShaderProgram(gl, "vertex-basic", "fragment-basic", [
    'u_projMatrix', 'u_viewMatrix', 'u_modelMatrix'
  ]);
  SHADER_PROGRAMS.PHONG = createShaderProgram(gl, "vertex-phong", "fragment-phong", [
    'u_projMatrix', 'u_viewMatrix', 'u_modelMatrix',
    'matAmb', 'matDif', 'matSpec', 'constants',
    'lightPosition', 'lightColor', 'numLights'
  ]);
  SHADER_PROGRAMS.GOURAD = createShaderProgram(gl, "vertex-gourad", "fragment-basic", [
    'u_projMatrix', 'u_viewMatrix', 'u_modelMatrix',
    'matAmb', 'matDif', 'matSpec', 'constants',
    'lightPosition', 'lightColor'
  ]);

  //HW470 Create the geometry for cylinder
  var cylinderGeo = surfaceOfRevolution(surfaceRevOptions.CYLINDER, blueGenerator, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);

  //HW470 create geometry for pot
  var potGeo = surfaceOfRevolution(surfaceRevOptions.MYSURFACE, blueGenerator, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);

  scene = new Scene(gl);
  scene.camera = new Camera(new Transform(0,0,3), 65, canvas.width/canvas.height, 0.1, 50);

  scene.lights.push(new Light(vec4(1.5,0,1.5,1), vec3(1,1,1)))
  scene.lights.push(new Light(vec4(1.5,0,-1.5,1), vec3(1,1,1)))
  scene.lights.push(new Light(vec4(0,0,2,1), vec3(1,1,1)))

  let cylinderMat = new PhongMaterial(gl, {
    ambient: vec3(0.05, 0.055, 0.09),
    diffuse: vec3(0.4, 0.4, 0.85),
    specular: vec3(1,1,1),
    constants: new PhongConstants(1.0, 1.0, 0.2, 100)
  }, 'phong')
  let cylinder = new Entity(gl, cylinderGeo, cylinderMat)
  cylinder.transform.translate(-2.25, 0, 0)
  cylinder.transform.computeTransform()
  scene.entities.push(cylinder)

  let potMat = new PhongMaterial(gl, {
    ambient: vec3(0.08, 0.0625, 0.09),
    diffuse: vec3(0.85, 0.45, 0.4),
    specular: vec3(0.8, 0.35, 0.3),
    constants: new PhongConstants(1.0, 1.0, 0.8, 100)
  }, 'phong')
  let pot = new Entity(gl, potGeo, potMat)
  pot.transform.translate(2.25, 0, 0)
  pot.transform.computeTransform()
  scene.entities.push(pot)

  render();
}

window.onload = init

function render() {
  scene.camera.transform = new Transform(4 * Math.sin(frames / 250), 2 * Math.sin(frames/500), 2 * Math.cos(frames / 250))
  scene.camera.transform.rotate(frames / 250 * 360 / (2 * Math.PI), vec3(0,1,0))
  scene.camera.transform.rotate(-40 * Math.sin(frames / 500), vec3(1,0,0))
  scene.camera.computeView()
  scene.lights[0].position = vec4(0, Math.sin(frames/100), 1, 1)
  scene.lights[1].position = vec4(0, Math.cos(frames/100), -1, 1)
  scene.lights[2].position = vec4(-4.5 * Math.sin(frames / 100), 0.5, 1.5 * Math.cos(frames / 100), 1)
  scene.draw(gl)
  // HW470: Get next availale frame and run this function again
  frames++;
  window.requestAnimationFrame(render);
}

