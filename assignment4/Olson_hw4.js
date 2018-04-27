// Gray Olson
// CSE 470
var canvas;
var gl;
var frames = 0;
var scene;

function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.width, canvas.height);

  scene = new Scene(gl);
  scene.camera = new Camera(new Transform(0,0,3), 65, canvas.width/canvas.height, 0.1, 50);

  scene.lights.push(new Light(vec4(1.5,0,1.5,1), vec3(0.4,0.5,1), 1))
  scene.lights.push(new Light(vec4(1.5,0,-1.5,1), vec3(1,0.6,0.3), 1))
  scene.lights.push(new Light(vec4(0,1.25,2,1), vec3(0.5,0.65,1), 2))
  scene.lights.push(new Light(vec4(5,2,2.5,1), vec3(1,1,1), 4))
  scene.lights.push(new Light(vec4(-5,2,-3,1), vec3(1,1,1), 4))
  scene.lights.push(new Light(vec4(-1,4,-3,1), vec3(0.8,0.8,1), 20))

  let cylinderMat = new PhongMaterial(gl, {
    ambient: vec3(0.05, 0.055, 0.09),
    diffuse: vec3(0.4, 0.4, 0.85),
    specular: vec3(1,1,1),
    constants: new PhongConstants(1.0, 1.0, 0.1, 10)
  }, 'brick.jpg')
  var cylinderGeo = surfaceOfRevolution(surfaceRevOptions.CYLINDER, blueGenerator, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);
  let cylinder = new Entity(gl, cylinderGeo, cylinderMat)
  cylinder.transform.translate(-2.25, 0, 0)
  cylinder.transform.computeTransform()
  scene.entities.push(cylinder)

  let potMat = new PhongMaterial(gl, {
    ambient: vec3(0.08, 0.0625, 0.09),
    diffuse: vec3(0.85, 0.45, 0.4),
    specular: vec3(0.8, 0.35, 0.3),
    constants: new PhongConstants(1.0, 1.0, 0.8, 100)
  })
  var potGeo = surfaceOfRevolution(surfaceRevOptions.MYSURFACE, blueGenerator, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);
  let pot = new Entity(gl, potGeo, potMat)
  pot.transform.translate(2.25, 0, 0)
  pot.transform.computeTransform()
  scene.entities.push(pot)

  let planeMat = new PhongMaterial(gl, {
    ambient: vec3(0.05, 0.055, 0.09),
    diffuse: vec3(0.4, 0.4, 0.85),
    specular: vec3(1,1,1),
    constants: new PhongConstants(1.0, 1.0, 0.1, 10)
  }, 'ground.jpg')
  let plane = new Entity(gl, planeY(2, 1, 8), planeMat)
  plane.transform.setScale(8)
  plane.transform.translate(0,-1,0)
  plane.transform.computeTransform()
  scene.entities.push(plane)

  let avatarMat = new PhongMaterial(gl, {
    ambient: vec3(0.05, 0.055, 0.09),
    diffuse: vec3(0.4, 0.4, 0.85),
    specular: vec3(1,1,1),
    constants: new PhongConstants(1.0, 1.0, 0.1, 10)
  }, 'metal.jpg')
  let avatar = new Entity(gl, cube(2,1,1,0.5), avatarMat)
  {
    avatar.transform.setScale(0.25)
    avatar.transform.translate(0, -0.5, 0)
    avatar.transform.computeTransform()

    let avatarHead = new Entity(gl, cube(1,1,1,0.5), avatarMat)
    {
      avatarHead.transform.setCenter(-0.5, 0, 0)
      avatarHead.transform.setScale(0.5)
      avatarHead.transform.rotate(20, vec3(0,0,1))
      avatarHead.transform.translate(1, 0.5, 0)
      avatarHead.transform.computeTransform()

      let avatarEarLeft = new Entity(gl, cube(1,1,3,0.5), avatarMat)
      avatarEarLeft.transform.setCenter(0, -2.5, 0)
      avatarEarLeft.transform.setScale(0.25)
      avatarEarLeft.transform.rotate(-30, vec3(1,0,0))
      avatarEarLeft.transform.translate(0, 0.25, -0.2)
      avatarEarLeft.transform.computeTransform()

      avatarHead.children.push(avatarEarLeft)

      let avatarEarRight = new Entity(gl, cube(1,1,3,0.5), avatarMat)
      avatarEarRight.transform.setCenter(0, -2.5, 0)
      avatarEarRight.transform.setScale(0.25)
      avatarEarRight.transform.rotate(30, vec3(1,0,0))
      avatarEarRight.transform.translate(0, 0.25, 0.2)
      avatarEarRight.transform.computeTransform()

      avatarHead.children.push(avatarEarRight)
    }
    avatar.children.push(avatarHead)

    let legFrontLeft = new Entity(gl, cube(1,1,4,0.5), avatarMat)
    legFrontLeft.transform.setCenter(0, 4, 0)
    legFrontLeft.transform.setScale(0.25)
    legFrontLeft.transform.translate(0.75, 0, 0.22)
    legFrontLeft.transform.computeTransform()

    avatar.children.push(legFrontLeft)

    let legFrontRight = new Entity(gl, cube(1,1,4,0.5), avatarMat)
    legFrontRight.transform.setCenter(0, 4, 0)
    legFrontRight.transform.setScale(0.25)
    legFrontRight.transform.translate(0.75, 0, -0.22)
    legFrontRight.transform.computeTransform()

    avatar.children.push(legFrontRight)

    let legBackLeft = new Entity(gl, cube(1,1,4,0.5), avatarMat)
    legBackLeft.transform.setCenter(0, 4, 0)
    legBackLeft.transform.setScale(0.25)
    legBackLeft.transform.translate(-0.75, 0, 0.25)
    legBackLeft.transform.computeTransform()

    avatar.children.push(legBackLeft)

    let legBackRight = new Entity(gl, cube(1,1,4,0.5), avatarMat)
    legBackRight.transform.setCenter(0, 4, 0)
    legBackRight.transform.setScale(0.25)
    legBackRight.transform.translate(-0.75, 0, -0.25)
    legBackRight.transform.computeTransform()

    avatar.children.push(legBackRight)
  }

  scene.entities.push(avatar)

  render();
}

window.onload = init

function render() {
  //HW470: ANIMATE CAMERA
  scene.camera.transform = new Transform(5 * Math.sin(frames / 250), Math.sin(frames/500) + 0.5, 3.5 * Math.cos(frames / 250))
  scene.camera.transform.rotate(frames / 250 * 360 / (2 * Math.PI), vec3(0,1,0))
  let rotAmt = -30 * Math.sin(frames/500)
  scene.camera.computeView()
  scene.camera.transform.rotate(rotAmt, vec3(1,0,0))
  scene.camera.computeView()

  //HW470: ANIMATE LIGHTS
  scene.lights[0].position = vec4(0, Math.sin(frames/100), 1, 1)
  scene.lights[1].position = vec4(0, Math.cos(frames/100), -1, 1)
  scene.lights[2].position = vec4(-4 * Math.sin(frames / 100), 1.25, 2 * Math.cos(frames / 100), 1)

  //HW470: ANIMATE AVATAR
  //HW470: Animate body
  scene.entities[3].transform.translation = translate(4 * Math.sin(frames/250), -0.5, 2 * Math.sin(2 * frames/250))
  scene.entities[3].transform.rotation = rotateY(180 / Math.PI * Math.atan2(Math.cos(2*frames/250), 2 * Math.cos(frames/250)))
  scene.entities[3].transform.computeTransform()
  //HW470 Animate head
  scene.entities[3].children[0].transform.rotation = rotateZ(15 * Math.sin(frames/10))
  scene.entities[3].children[0].transform.computeTransform()
  //HW470 Animate ears
  scene.entities[3].children[0].children[0].transform.rotation = rotateX(16 * Math.sin(frames/30) + 14)
  scene.entities[3].children[0].children[0].transform.computeTransform()
  scene.entities[3].children[0].children[1].transform.rotation = rotateX(-16 * Math.sin(frames/30) - 14)
  scene.entities[3].children[0].children[1].transform.computeTransform()
  //HW470 Animate legs
  //left
  scene.entities[3].children[1].transform.rotation = rotateZ(15 * Math.sin(frames/20))
  scene.entities[3].children[1].transform.computeTransform()
  scene.entities[3].children[3].transform.rotation = rotateZ(15 * Math.sin(frames/20))
  scene.entities[3].children[3].transform.computeTransform()
  //right
  scene.entities[3].children[2].transform.rotation = rotateZ(-15 * Math.sin(frames/20))
  scene.entities[3].children[2].transform.computeTransform()
  scene.entities[3].children[4].transform.rotation = rotateZ(-15 * Math.sin(frames/20))
  scene.entities[3].children[4].transform.computeTransform()
  scene.draw(gl)
  frames++;
  window.requestAnimationFrame(render);
}

