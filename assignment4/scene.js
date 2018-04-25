function Scene(gl) {
  this.entities = []
  this.lights = []
  this.blendFuncStack = [{s: gl.ONE, d: gl.NONE}]
  this.camera = null
  this.modelMatrixStack = [translate(0,0,0)]
}

Scene.prototype.pushBlendFunc = function(gl, params) {
  this.blendFuncStack.push(params)
  gl.blendFunc(params.s, params.d)
}

Scene.prototype.popBlendFunc = function(gl) {
  this.blendFuncStack.pop()
  let params = this.getBlendFunc()
  gl.blendFunc(params.s, params.d)
}

Scene.prototype.getBlendFunc = function() {
  return this.blendFuncStack[this.blendFuncStack.length - 1]
}

Scene.prototype.pushModelMatrix = function(transform) {
  this.modelMatrixStack.push(transform)
}

Scene.prototype.popModelMatrix = function() {
  return this.modelMatrixStack.pop()
}

Scene.prototype.getModelMatrix = function() {
  return this.modelMatrixStack[this.modelMatrixStack.length - 1]
}

Scene.prototype.sendMvpUniforms = function(gl, shaderProgram) {
  gl.uniformMatrix4fv(shaderProgram.u_projMatrixLoc, false, flatten(this.camera.projectionMatrix));
  gl.uniformMatrix4fv(shaderProgram.u_viewMatrixLoc, false, flatten(this.camera.viewMatrix));
  gl.uniformMatrix4fv(shaderProgram.u_modelMatrixLoc, false, flatten(this.getModelMatrix()));
}

Scene.prototype.draw = function(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // this.pushBlendFunc(gl, {s: gl.ONE, d: gl.NONE})
  this.entities.forEach((entity) => {
    this._drawInner(gl, entity)
  })
  // this.popBlendFunc(gl)
}

Scene.prototype._drawInner = function(gl, entity) {
  entity.bind(gl)
  this.pushModelMatrix(mult(this.getModelMatrix(), entity.transform.transform))
  this.sendMvpUniforms(gl, entity.material.shaderProgram.locs)
  this.lights.forEach((light) => {
    light.sendData(gl, entity.material.shaderProgram.locs)
    entity.draw(gl)
  })
  entity.children.forEach(child => this._drawInner(gl, child))
}


function Camera(transform, fov, aspect, near, far) {
  this.transform = transform
  this.fov = fov
  this.aspect = aspect
  this.near = near || 0.1
  this.far = far || 50
  this.computeProjection()
  this.computeView()
}

Camera.prototype.computeView = function() {
  this.transform.computeTransform()
  this.viewMatrix = inverse4(this.transform.transform)
}

Camera.prototype.computeProjection = function() {
  this.projectionMatrix = perspective(this.fov, this.aspect, this.near, this.far);
}

function Light(position, color) {
  this.position = position
  this.color = color
}

Light.prototype.sendData = function(gl, locs) {
  gl.uniform4fv(locs.lightPosition, flatten(this.position))
  gl.uniform3fv(locs.lightColor, flatten(this.color))
}