var SHADER_PROGRAMS = {};

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
  program.locs.strength = gl.getAttribLocation(program, 'a_lightStrength')
  return program
}

function Scene(gl) {
  this.entities = []
  this.lights = []
  this.blendFuncStack = [{s: gl.ONE, d: gl.NONE}]
  this.camera = null
  this.modelMatrixStack = [translate(0,0,0)]

  gl.clearColor(0.12, 0.1, 0.15, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND)
  // gl.enable(gl.CULL_FACE)
  gl.depthFunc(gl.LEQUAL)

  SHADER_PROGRAMS.BASIC = createShaderProgram(gl, "vertex-basic", "fragment-basic", [
    'u_projMatrix', 'u_viewMatrix', 'u_modelMatrix'
  ]);
  SHADER_PROGRAMS.LIGHTS = createShaderProgram(gl, "vertex-light", "fragment-basic", [
    'u_projMatrix', 'u_viewMatrix', 'u_modelMatrix'
  ]);
  SHADER_PROGRAMS.PHONG = createShaderProgram(gl, "vertex-phong", "fragment-phong", [
    'u_projMatrix', 'u_viewMatrix', 'u_modelMatrix',
    'matAmb', 'matDif', 'matSpec', 'constants',
    'lightPosition', 'lightColor', 'lightStrength', 'numLights'
  ]);
  SHADER_PROGRAMS.PHONG_TEXTURED = createShaderProgram(gl, "vertex-phong", "fragment-phong-textured", [
    'u_projMatrix', 'u_viewMatrix', 'u_modelMatrix',
    'matAmb', 'matDif', 'matSpec', 'constants',
    'lightPosition', 'lightColor', 'lightStrength', 'numLights',
    'u_texture'
  ]);

  this.lightsPosBuff = gl.createBuffer();
  this.lightsColorBuff = gl.createBuffer();
  this.lightsStrengthBuff = gl.createBuffer();
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

Scene.prototype.sendMvpUniforms = function(gl, locs) {
  gl.uniformMatrix4fv(locs.u_projMatrix, false, flatten(this.camera.projectionMatrix));
  gl.uniformMatrix4fv(locs.u_viewMatrix, false, flatten(this.camera.viewMatrix));
  gl.uniformMatrix4fv(locs.u_modelMatrix, false, flatten(this.getModelMatrix()));
}

Scene.prototype.draw = function(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this.entities.forEach((entity) => {
    this._drawInner(gl, entity)
  })
  this.drawLights(gl)
}

Scene.prototype.drawLights = function(gl) {
  gl.useProgram(SHADER_PROGRAMS.LIGHTS);
  let locs = SHADER_PROGRAMS.LIGHTS.locs

  this.sendMvpUniforms(gl, locs)

  gl.bindBuffer( gl.ARRAY_BUFFER, this.lightsPosBuff );
  gl.vertexAttribPointer( locs.position, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( locs.position );

  let positions = this.lights.map(light => light.position)
  gl.bufferData( gl.ARRAY_BUFFER, flatten(positions), gl.DYNAMIC_DRAW );

  gl.bindBuffer( gl.ARRAY_BUFFER, this.lightsColorBuff );
  gl.vertexAttribPointer( locs.color, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( locs.color );

  let colors = this.lights.map(light => light.color)
  gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW );

  gl.bindBuffer( gl.ARRAY_BUFFER, this.lightsStrengthBuff );
  gl.vertexAttribPointer( locs.strength, 1, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( locs.strength );

  let strengths = this.lights.map(light => light.strength)
  gl.bufferData( gl.ARRAY_BUFFER, flatten(strengths), gl.DYNAMIC_DRAW );

  gl.drawArrays(gl.POINTS, 0, this.lights.length);
}

Scene.prototype._drawInner = function(gl, entity) {
  entity.bind(gl)
  this.pushModelMatrix(mult(entity.transform.transform, this.getModelMatrix()))
  this.sendMvpUniforms(gl, entity.material.shaderProgram.locs)
  gl.uniform1f(entity.material.shaderProgram.locs.numLights, this.lights.length)
  this.lights.forEach((light, i) => {
    if (i === 1) {
      this.pushBlendFunc(gl, {s: gl.ONE, d: gl.ONE})
    }
    light.sendData(gl, entity.material.shaderProgram.locs)
    //console.log(gl.getUniform(entity.material.shaderProgram, entity.material.shaderProgram.locs.lightStrength))
    entity.draw(gl)
  })
  this.popBlendFunc(gl)
  entity.children.forEach(child => this._drawInner(gl, child))
  this.popModelMatrix()
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

function Light(position, color, strength) {
  this.position = position
  this.color = color
  this.strength = strength
}

Light.prototype.sendData = function(gl, locs) {
  gl.uniform4fv(locs.lightPosition, flatten(this.position))
  gl.uniform3fv(locs.lightColor, flatten(this.color))
  gl.uniform1f(locs.lightStrength, this.strength)
}