var SHADER_PROGRAMS = {};

// HW470: A convenience function to create a shader program with a vertex shader name,
// fragment shader name, and list of uniforms. Stores locations in its context to be used
// later.
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

// HW470: Scene constructor function
function Scene(gl) {
  this.entities = []
  this.lights = []
  this.blendFuncStack = [{s: gl.ONE, d: gl.NONE}]
  this.camera = null
  this.modelMatrixStack = [translate(0,0,0)]

  gl.clearColor(0.12, 0.13, 0.18, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND)
  // gl.enable(gl.CULL_FACE)
  gl.depthFunc(gl.LEQUAL)

  // HW470: Create the different shader programs we'll use: phong, phong with texture, and a shader
  // to draw the representations of the lights
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

  // HW470: Buffers for drawing light representations
  this.lightsPosBuff = gl.createBuffer();
  this.lightsColorBuff = gl.createBuffer();
  this.lightsStrengthBuff = gl.createBuffer();
}

// HW470: Sets the gl blendFunc and stores the previous to go back to later
Scene.prototype.pushBlendFunc = function(gl, params) {
  this.blendFuncStack.push(params)
  gl.blendFunc(params.s, params.d)
}

// HW470: Go back to the previous blend function in the stack
Scene.prototype.popBlendFunc = function(gl) {
  this.blendFuncStack.pop()
  let params = this.getBlendFunc()
  gl.blendFunc(params.s, params.d)
}

Scene.prototype.getBlendFunc = function() {
  return this.blendFuncStack[this.blendFuncStack.length - 1]
}

// HW470: Push a transform matrix onto the model matrix stack
Scene.prototype.pushModelMatrix = function(transform) {
  this.modelMatrixStack.push(transform)
}

// HW470: Pop a transform matrix off the model matrix stack
Scene.prototype.popModelMatrix = function() {
  return this.modelMatrixStack.pop()
}

// HW470: Get the current model matrix off the top of the stack
Scene.prototype.getModelMatrix = function() {
  return this.modelMatrixStack[this.modelMatrixStack.length - 1]
}

// HW470: Send the model, view, and projection matrices to the currently
// bound shader program
Scene.prototype.sendMvpUniforms = function(gl, locs) {
  gl.uniformMatrix4fv(locs.u_projMatrix, false, flatten(this.camera.projectionMatrix));
  gl.uniformMatrix4fv(locs.u_viewMatrix, false, flatten(this.camera.viewMatrix));
  gl.uniformMatrix4fv(locs.u_modelMatrix, false, flatten(this.getModelMatrix()));
}

// HW470: Draw the scene in its current state (all its entities with its lights
// and using its camera)
Scene.prototype.draw = function(gl) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this.entities.forEach((entity) => {
    this._drawInner(gl, entity)
  })
  this.drawLights(gl)
}

// HW470: Draw the point representations of the lights
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

// HW470: The main workhorse, draws a single entity with each of the lights
// in the scene
Scene.prototype._drawInner = function(gl, entity) {
  // HW470: First we bind the entity's vertex attributes, index buffer, uniforms, etc.
  entity.bind(gl)
  // HW470: Next we push the entity's transform matrix onto the model matrix stack, multiplying by the
  // current one to maintain hierarchy
  this.pushModelMatrix(mult(this.getModelMatrix(), entity.transform.transform))
  // HW470: Send our mvp matrices and number of lights
  this.sendMvpUniforms(gl, entity.material.shaderProgram.locs)
  gl.uniform1f(entity.material.shaderProgram.locs.numLights, this.lights.length)
  // HW470: For each light, we send the light's data to the shader and then draw the entity
  this.lights.forEach((light, i) => {
    // HW470: The first light is drawn with normal opaque blending and the rest are done with additive blending
    if (i === 1) {
      this.pushBlendFunc(gl, {s: gl.ONE, d: gl.ONE})
    }
    light.sendData(gl, entity.material.shaderProgram.locs)
    entity.draw(gl)
  })
  // HW470: Go back to regular blending for the next entity
  this.popBlendFunc(gl)
  // HW470: Recursively draw all of this entity's children with this entity's model matrix still on the stack
  entity.children.forEach(child => this._drawInner(gl, child))
  // HW470: Pop this entity's model matrix off the stack
  this.popModelMatrix()
}

// HW470: Just a convenience for camera variable handling
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

// HW470: Sends this light's data to the currently bound shader program
Light.prototype.sendData = function(gl, locs) {
  gl.uniform4fv(locs.lightPosition, flatten(this.position))
  gl.uniform3fv(locs.lightColor, flatten(this.color))
  gl.uniform1f(locs.lightStrength, this.strength)
}