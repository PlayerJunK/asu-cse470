function Scene(gl) {
  this.objects = []
  this.lights = []
  this.blendFuncStack = [{s: gl.ONE, d: gl.NONE}]
  this.camera = null
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

Scene.prototype.draw = function(gl) {
  this.pushBlendFunc(gl, {s: gl.ONE, d: gl.NONE})
  this.objects.forEach((object) => {
    this._drawInner(gl, object)
  })
  this.popBlendFunc(gl)
}

Scene.prototype._drawInner = function(gl, object) {
  object.bind(gl)
  this.lights.forEach((light) => {
    light.sendData(gl)
    object.draw(gl)
  })
  object.children.forEach(child => this._drawInner(gl, child))
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
  this.perspectiveMatrix = perspective(this.fov, this.aspect, this.near, this.far);
}