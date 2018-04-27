// HW470: Create a Transform type that will allow easy ability to rotate and translate a cube instance
function Transform(x, y, z) {
  this.rotation = rotateX(0)
  this.translation = translate(x, y, z)
  this.center = translate(0,0,0)
  this.transform = this.translation
  this.scaling = scalem(1, 1, 1)
}

Transform.prototype.computeTransform = function () {
  // HW470: Create total transform (Model matrix) by first performing rotation
  // and then scaling and then translating
  //
  // Scaling and rotation are performed about the center of the cube by first translating
  // in the opposite vector
  this.transform = mult(this.translation, mult(mult(this.rotation, this.scaling), this.center))
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

Transform.prototype.setCenter = function (x,y,z) {
  // HW470: replace existing center point
  this.center = inverse4(translate(x,y,z))
}

Transform.prototype.translate = function (x, y, z) {
  // HW470: translate existing translation by x,y,z
  this.translation = mult(this.translation, translate(x, y, z))
}

// HW470: Convenience for storing phong constants
function PhongConstants(ka, kd, ks, s) {
  this.ka = ka
  this.kd = kd
  this.ks = ks
  this.s = s
}

// HW470: get these constants represented as a vec to send to shader
PhongConstants.prototype.asVec = function () {
  return vec4(this.ka, this.kd, this.ks, this.s)
}

// HW470: Object representing the state/information needed to render geometry
// using a Phong-based material
function PhongMaterial(gl, props, texturePath) {
  // HW470: We can either have a texture or not
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

// HW470: Configure a texture
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

// HW470: Sends all the data about this material to the shader
PhongMaterial.prototype.sendData = function (gl) {
  gl.uniform3fv(this.shaderProgram.locs.matAmb, flatten(this.props.ambient));
  gl.uniform3fv(this.shaderProgram.locs.matDif, flatten(this.props.diffuse));
  gl.uniform3fv(this.shaderProgram.locs.matSpec, flatten(this.props.specular));
  gl.uniform4fv(this.shaderProgram.locs.constants, flatten(this.props.constants.asVec()));
  gl.bindTexture( gl.TEXTURE_2D, this.texture );
  gl.uniform1i(this.shaderProgram.locs.u_texture, 0);
}

// HW470: Holds the data about an entity: transformation, geometry, material, children
function Entity(gl, geometry, material) {
  this.transform = new Transform(0, 0, 0)
  this.geometry = geometry
  this.material = material
  this.children = []
  this.geometry.initGL(gl)
}

// HW470: Sends the material and geometry data for this entity to the GPU
Entity.prototype.sendData = function (gl) {
  this.material.sendData(gl)
  this.geometry.sendData(gl)
}

// HW470: Sets up the necessary opengl state to be ready to draw this entity
Entity.prototype.bind = function(gl) {
  gl.useProgram(this.material.shaderProgram)
  this.material.sendData(gl)
  this.geometry.enableAttributes(gl, this.material.shaderProgram.locs)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geometry.buffers.index)
}

// HW470: Actually draws this entity with current shader state
Entity.prototype.draw = function (gl) {
  gl.drawElements(gl.TRIANGLES, this.geometry.indices.length, gl.UNSIGNED_SHORT, 0)
}