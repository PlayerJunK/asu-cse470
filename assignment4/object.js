// HW470: Create a Transform type that will allow easy ability to rotate and translate a cube instance
function Transform(x, y, z) {
  this.rotation = rotateX(0)
  this.center = translate(-0.5, -0.5, 0.5)
  this.translation = translate(x, y, z)
  this.transform = translate(0, 0, 0)
  this.scaling = scalem(1, 1, 1)
}

Transform.prototype.computeTransform = function () {
  // HW470: Create total transform (ModelView matrix) by first performing rotation
  // and then scaling and then translating
  //
  // Scaling and rotation are performed about the center of the cube by first translating
  // in the opposite vector
  this.transform = mult(this.translation, mult(mult(this.scaling, this.rotation), this.center))
}

Transform.prototype.getTransform = function () {
  return this.transform
}

Transform.prototype.rotate = function (theta, axis) {
  // HW470: Rotate existing rotation matrix by specified theta and axis
  this.rotation = mult(rotate(theta, axis), this.rotation)
}

Transform.prototype.setScale = function (scale) {
  // HW470: replace existing scale matrix with new one
  this.scaling = scalem(scale, scale, scale)
}

Transform.prototype.translate = function (x, y, z) {
  // HW470: translate existing translation by x,y,z
  this.translation = mult(this.translation, translate(x, y, z))
}

function PhongConstants(ka, kd, ks, s) {
  this.ka = ka
  this.kd = kd
  this.ks = ks
  this.s = s
}

PhongConstants.prototype.asVec = function () {
  return vec4(this.ka, this.kd, this.ks, this.s)
}

function PhongMaterial(gl, props) {
  this.kind = 'phong'
  this.props = props
  this.locs = {
    matAmb: gl.getUniformLocation(SHADER_PROGRAMS.PHONG, 'matAmb'),
    matDif: gl.getUniformLocation(SHADER_PROGRAMS.PHONG, 'matDif'),
    matSpec: gl.getUniformLocation(SHADER_PROGRAMS.PHONG, 'matSpec'),
    constants: gl.getUniformLocation(SHADER_PROGRAMS.PHONG, 'constants'),
  }
}

PhongMaterial.prototype.sendData = function (gl) {
  gl.uniform3fv(this.locs.matAmb, flatten(this.props.ambient));
  gl.uniform3fv(this.locs.matDif, flatten(this.props.diffuse));
  gl.uniform3fv(this.locs.matSpec, flatten(this.props.specular));
  gl.uniform4fv(this.locs.constants, flatten(this.props.constants.asVec()));
}

function BasicMaterial(properties) {
  this.kind = 'basic'
  this.props = props
}


function InstanceTransform(move, deform) {
  this.movement = move
  this.deformation = deform
}

InstanceTransform.prototype.computeTransform = function () {
  this.transform = mult(this.movement.transform, this.deformation.transform)
}

function Entity(gl, geometry, material) {
  this.transform = new Transform(0, 0, 0)
  this.geometry = geometry
  this.material = material
  this.children = []
  switch (this.material.kind) {
    case 'phong':
      this.shaderProgram = SHADER_PROGRAMS.PHONG
      this.attribLocs = {
        position: gl.getAttribLocation(this.shaderProgram, 'a_vertexPosition'),
        normal: gl.getAttribLocation(this.shaderProgram, 'a_vertexNormal'),
        texCoord: gl.getAttribLocation(this.shaderProgram, 'a_texCoord')
      }
      break
    case 'basic':
      this.shaderProgram = SHADER_PROGRAMS.BASIC
      this.attribLocs = {
        position: gl.getAttribLocation(this.shaderProgram, 'a_vertexPosition'),
        color: gl.getAttribLocation(this.shaderProgram, 'a_vertexColor'),
        texCoord: gl.getAttribLocation(this.shaderProgram, 'a_texCoord')
      }
      break
  }
  this.geometry.initGL(gl)
}

Entity.prototype.sendData = function (gl) {
  this.material.sendData(gl)
  this.geometry.sendData(gl)
}

Entity.prototype.bind = function(gl) {
  gl.useProgram(this.material.shaderProgram)
  this.geometry.enableAttributes(gl, this.material.locs)
}

Entity.prototype.draw = function (gl) {
  gl.drawElements(gl.TRIANGLES, this.geometry.indices.length, gl.UNSIGNED_SHORT, 0)
}