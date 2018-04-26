// HW470: Create a Transform type that will allow easy ability to rotate and translate a cube instance
function Transform(x, y, z) {
  this.rotation = rotateX(0)
  this.translation = translate(x, y, z)
  this.transform = this.translation
  this.scaling = scalem(1, 1, 1)
}

Transform.prototype.computeTransform = function () {
  // HW470: Create total transform (ModelView matrix) by first performing rotation
  // and then scaling and then translating
  //
  // Scaling and rotation are performed about the center of the cube by first translating
  // in the opposite vector
  this.transform = mult(this.translation, mult(this.scaling, this.rotation))
}

Transform.prototype.getTransform = function () {
  return this.transform
}

Transform.prototype.rotate = function (theta, axis) {
  // HW470: Rotate existing rotation matrix by specified theta and axis
  this.rotation = mult(this.rotation, rotate(theta, axis))
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

function PhongMaterial(gl, props, texturePath) {
  if (typeof texturePath !== 'undefined') {
    this.shaderProgram = SHADER_PROGRAMS.PHONG_TEXTURED
    this.texturePath = texturePath
    this.loadTexture()
  } else {
    this.shaderProgram = SHADER_PROGRAMS.PHONG
  }
  this.props = props
}

PhongMaterial.prototype.loadTexture = function() {
  this.textureImage = new Image();
  this.textureImage.onload = this.configureTexture.bind(this)
  this.textureImage.src = this.texturePath;
}

PhongMaterial.prototype.configureTexture = function() {
  this.texture = gl.createTexture();
  gl.bindTexture( gl.TEXTURE_2D, this.texture );
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
       gl.RGB, gl.UNSIGNED_BYTE, this.textureImage );
  gl.generateMipmap( gl.TEXTURE_2D );
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                    gl.NEAREST_MIPMAP_LINEAR );
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}

PhongMaterial.prototype.sendData = function (gl) {
  gl.uniform3fv(this.shaderProgram.locs.matAmb, flatten(this.props.ambient));
  gl.uniform3fv(this.shaderProgram.locs.matDif, flatten(this.props.diffuse));
  gl.uniform3fv(this.shaderProgram.locs.matSpec, flatten(this.props.specular));
  gl.uniform4fv(this.shaderProgram.locs.constants, flatten(this.props.constants.asVec()));
  gl.bindTexture( gl.TEXTURE_2D, this.texture );
  gl.uniform1i(this.shaderProgram.locs.u_texture, 0);
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
  this.material.sendData(gl)
  this.geometry.enableAttributes(gl, this.material.shaderProgram.locs)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geometry.buffers.index)
}

Entity.prototype.draw = function (gl) {
  gl.drawElements(gl.TRIANGLES, this.geometry.indices.length, gl.UNSIGNED_SHORT, 0)
}