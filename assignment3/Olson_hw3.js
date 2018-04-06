
/*
 * your name
 */
// I've put some code in this file for ideas for set up ..  you don't need to use these data structures


var canvas;
var gl;
// shader with uniform color (if you want)
//var program0;
// shader with lighting
var program1;

// HW470: whether the light is currently at the eye position
var eyelight = false;
// whether the light is rotating or not
var rotatelight = false;
var lightangle = 0;
var lightradiusSlider = null;
var dz = 0;

var shininessSlider = null;

//HW470 Whether to draw normals/wireframe
var wireframe = false;
var drawNormals = false;

// Object properties
// You can choose to have one object data structure and re-load when user chooses new SOR
// OR you can build both and keep track of where 2nd one starts in data structures for GPU (vertexStart)
var cylinderObject = 
  {
    //HW470: holds geometry for object
    geometry: null,

  };

// HW470: My custom object
var potObject = 
  {
    //HW470: holds geometry for object
    geometry: null,

  };

var vaseObject = 
  {
    //HW470: holds geometry for object
    geometry: null,

  };

//HW470: A blue plastic material
    // material properties  
var plastic = {
    ambient: vec4(1.0, 0.0, 0.0, 1.0),
    diffuse: vec4(0.3, 0.4, 0.55, 1.0),
    specular: vec4(1.0, 1.0, 1.0, 1.0),
    shininess: 100.0,
}
//HW470: A copper metalic material
var copper = {
    // material properties  
    ambient: vec4(1.0, 0.0, 0.0, 1.0),
    diffuse: vec4(0.6, 0.3, 0.18, 1.0),
    specular: vec4(0.8, 0.35, 0.35, 1.0),
    shininess: 20.0,
}

//HW470: will hold currently active object
var activeObject =null;


var viewer = 
  {
    eye: vec3(0.0, 0.0, 3.0),
    at:  vec3(0.0, 0.0, 0.0),  
    up:  vec3(0.0, 1.0, 0.0),

    // for moving around object; set vals so at origin
    radius: 3.0,
    theta: 0,
    phi: 0
  };

var perspOptions = 
  {
    fovy: 60,
    aspect: 1,
    near: 0.1,
    far:  10
  }

// modelview and projection matrices
// HW470: A location for each of the shader programs
var mvMatrix;
var u_mvMatrixLoc;
var basic_mvMatrixLoc;
var normal_mvMatrixLoc;
var light_mvMatrixLoc;

var projMatrix;
var u_projMatrixLoc;
var basic_projMatrixLoc;
var light_projMatrixLoc;


// HW470: setup GPU vertex attribute globals
var vPosBuff;
var a_vertexPositionLoc;
var basic_vertexPositionLoc;
var vNormalBuff;
var a_vertexNormalLoc;

var normalPosBuff;
var normal_vertexPositionLoc;

var lightPosBuff;
var light_vertexPositionLoc;

// index buffer for triangulated mesh
var indexBuf;
// index buffer for wireframe
var wireIndexBuf;



// Light properties
// HW470: adjust so that it basically just lets through
// material when multiplied (except no ambient)
var light =
  {
    position: vec4(1.0, 1.0, 1.0, 1.0),
    ambient: vec4(0.0, 0.0, 0.0, 1.0),
    diffuse: vec4(1.0, 1.0, 1.0, 1.0),
    specular: vec4(1.0, 1.0, 1.0, 1.0),
  };



var ambientProductLoc;
var diffuseProductLoc;
var specularProductLoc;
var lightPositionLoc;
var shininessLoc;

// mouse interaction

var mouse = {
  prevX: 0,
  prevY: 0,

  leftDown: false,
  rightDown: false,
};

//HW470: Sets active object to given object
function setObject(object) {
  // set active object
  activeObject = object;
  dz = object.geometry.maxZ;
  // HW470 use times 10 to get more precision on the slider
  lightradiusSlider.min = 10*dz;
  lightradiusSlider.max = 100*dz;

  // setup regular shaded drawing
  gl.useProgram(program1);
  // HW470 must bind the buffer as well as its associated attrib pointer
  // because we have another array with the same attrib location that we are also using
  gl.bindBuffer( gl.ARRAY_BUFFER, vPosBuff );
  gl.vertexAttribPointer( a_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( a_vertexPositionLoc );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(object.geometry.vertices), gl.STATIC_DRAW );

  gl.bindBuffer( gl.ARRAY_BUFFER, vNormalBuff );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(object.geometry.normals), gl.STATIC_DRAW );

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  // HW470: actually transfer indices to the index buffer
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(object.geometry.indices)), gl.STATIC_DRAW);

  // setup wireframe
  gl.useProgram(program2);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuf);
  // HW470: actually transfer indices to the index buffer
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(object.geometry.wireIndices)), gl.STATIC_DRAW);

  // setup normals
  gl.useProgram(program3);

  // HW470 must bind the buffer as well as its associated attrib pointer
  // because we have another array with the same attrib location that we are also using
  gl.bindBuffer( gl.ARRAY_BUFFER, normalPosBuff );
  gl.vertexAttribPointer( normal_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( normal_vertexPositionLoc );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(object.geometry.normalDrawVerts), gl.STATIC_DRAW );

}

//HW470: Sets active material to given material
function setMat(mat) {
  gl.useProgram(program1);
  gl.uniform4fv(ambientProductLoc, flatten(mat.ambientProduct));
  gl.uniform4fv(diffuseProductLoc, flatten(mat.diffuseProduct));
  gl.uniform4fv(specularProductLoc, flatten(mat.specularProduct));
  shininessSlider.value = mat.shininess;
}


// =================================================================================
// ========= Initialize Graphics ===================================================
// =================================================================================
window.onload = function init() {

  // set up canvas
  canvas = document.getElementById( "gl-canvas" );
  // set up slider elements
  shininessSlider = document.getElementById("shininess");
  lightradiusSlider = document.getElementById("lightradius");
  //set aspect ratio
  perspOptions.aspect = canvas.width/canvas.height;

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  // Define viewport size and background color and enable zbuffering
  gl.viewport( 0, 0, canvas.width, canvas.height );

  gl.clearColor( 0.12, 0.1, 0.15, 1.0 ); 

  gl.enable(gl.DEPTH_TEST);

  //  Load shaders:  program1 for shading, program2 for wireframe, program3 for normals, program4 for the light
  program1 = initShaders( gl, "vertex-shader1", "fragment-shader" );
  program2 = initShaders( gl, "basic-vertex-shader", "fragment-shader" );
  program3 = initShaders( gl, "normals-vertex-shader", "fragment-shader" );
  program4 = initShaders( gl, "light-vertex-shader", "fragment-shader" );

  //HW470 Create the geometry for cylinder
  cylinderObject.geometry = geometry(surfaceRevOptions.CYLINDER, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);
  console.log(`Cylinder Minmax Box Dimensions: (${cylinderObject.geometry.maxZ*2}, 2, ${cylinderObject.geometry.maxZ*2})`);

  //HW470 create geometry for pot
  potObject.geometry = geometry(surfaceRevOptions.MYSURFACE, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);
  console.log(`Pot Minmax Box Dimensions: (${potObject.geometry.maxZ*2}, 2, ${potObject.geometry.maxZ*2})`);

  //HW470 create geometry for pot
  vaseObject.geometry = geometry(surfaceRevOptions.MYSURFACE2, surfaceRevOptions.tessGenDir, surfaceRevOptions.tessRotDir);
  console.log(`Pot Minmax Box Dimensions: (${vaseObject.geometry.maxZ*2}, 2, ${vaseObject.geometry.maxZ*2})`);

  //HW470 Pre-compute lighting model products for bronze mat
  copper.ambientProduct = mult(copper.ambient, light.ambient);
  copper.diffuseProduct = mult(copper.diffuse, light.diffuse);
  copper.specularProduct = mult(copper.specular, light.specular);

  //HW470 Pre-compute lighting model products for plastic mat
  plastic.ambientProduct = mult(plastic.ambient, light.ambient);
  plastic.diffuseProduct = mult(plastic.diffuse, light.diffuse);
  plastic.specularProduct = mult(plastic.specular, light.specular);

  // HW470: Initialize buffers (will comment rest of this section but not continue spamming HW470...)
  gl.useProgram(program1);
  // Create vertex position buffer
  vPosBuff = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vPosBuff );

  // Associate a_vertexPosition attribute in shader to the buffer
  a_vertexPositionLoc = gl.getAttribLocation( program1, "a_vertexPosition" );
  gl.vertexAttribPointer( a_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( a_vertexPositionLoc );

  // Create vertex normal buffer
  vNormalBuff = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vNormalBuff );

  // Associate a_vertexNormal attribute in shader to the buffer
  a_vertexNormalLoc = gl.getAttribLocation( program1, "a_vertexNormal" );
  gl.vertexAttribPointer( a_vertexNormalLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( a_vertexNormalLoc );

  // create index buffer
  indexBuf = gl.createBuffer();

  // Setup program2
  gl.useProgram(program2);
  // bind same position buffer
  gl.bindBuffer( gl.ARRAY_BUFFER, vPosBuff );

  // Associate vPosition attribute in shader to the buffer
  basic_vertexPositionLoc = gl.getAttribLocation( program2, "vPosition" );
  gl.vertexAttribPointer( basic_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( basic_vertexPositionLoc );

  // Create wire index buffer
  wireIndexBuf = gl.createBuffer();

  // Setup program3
  gl.useProgram(program3);
  // Create vertex position buffer for normals shader
  normalPosBuff = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, normalPosBuff );

  // Associate vPosition attribute in shader to the buffer
  normal_vertexPositionLoc = gl.getAttribLocation( program3, "vPosition" );
  gl.vertexAttribPointer( normal_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( normal_vertexPositionLoc );

  // Setup program4
  gl.useProgram(program4);
  // Create vertex position buffer for light shader
  lightPosBuff = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, lightPosBuff );

  // Associate vPosition attribute in shader to the buffer
  light_vertexPositionLoc = gl.getAttribLocation( program4, "vPosition" );
  gl.vertexAttribPointer( light_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( light_vertexPositionLoc );

  // HW470: get all uniform locs
  gl.useProgram(program1);
  lightPositionLoc = gl.getUniformLocation( program1, "lightPosition");
  ambientProductLoc = gl.getUniformLocation( program1, "ambientProduct");
  diffuseProductLoc = gl.getUniformLocation( program1, "diffuseProduct");
  specularProductLoc = gl.getUniformLocation( program1, "specularProduct");
  shininessLoc = gl.getUniformLocation( program1, "shininess");

  // HW470 Set initial object to be cylinder
  setObject(cylinderObject)
  // HW470 set initial material to be plastic
  setMat(plastic)

  // set initial eye position now that we know dz
  viewer.eye = vec3(0.0, 0.0, 3*dz)
  console.log(`Initial eye pos: (0, 0, ${3*dz}), at: (0, 0, 0), up: <0, 1, 0>`);
  viewer.radius = 3*dz


  // HW470: initialize and set up uniform locations for mv/p matrices
  mvMatrix = lookAt(vec3(viewer.eye), viewer.at, viewer.up);
  console.log(`Initial perspective options: \nfovy: ${perspOptions.fovy}, aspect: ${perspOptions.aspect}, near: ${perspOptions.near}, far: ${perspOptions.far}`);
  projMatrix = perspective(perspOptions.fovy, perspOptions.aspect, perspOptions.near, perspOptions.far);

  u_projMatrixLoc = gl.getUniformLocation( program1, "u_projMatrix" );
  u_mvMatrixLoc = gl.getUniformLocation( program1, "u_mvMatrix" );

  // HW470: bind mv/p matrix for program2
  gl.useProgram(program2)

  basic_projMatrixLoc = gl.getUniformLocation(program2, "u_projMatrix");
  basic_mvMatrixLoc = gl.getUniformLocation( program2, "u_mvMatrix" );

  // HW470: bind mv/p matrix for program3
  gl.useProgram(program3)

  normal_projMatrixLoc = gl.getUniformLocation(program3, "u_projMatrix");
  normal_mvMatrixLoc = gl.getUniformLocation( program3, "u_mvMatrix" );

  // HW470: bind mv/p matrix for program4
  gl.useProgram(program4)

  light_projMatrixLoc = gl.getUniformLocation(program4, "u_projMatrix");
  light_mvMatrixLoc = gl.getUniformLocation( program4, "u_mvMatrix" );


  // ======================================================================
  // ========================== Interaction ===============================
  // ======================================================================
  // HW470: Setup interaction buttons
  document.getElementById('cylinder').onclick = e => {
    setObject(cylinderObject)
  }
  document.getElementById('pot').onclick = e => {
    setObject(potObject)
  }
  document.getElementById('vase').onclick = e => {
    setObject(vaseObject)
  }
  document.getElementById('plastic').onclick = e => {
    setMat(plastic)
  }
  document.getElementById('copper').onclick = e => {
    setMat(copper)
  }
  document.getElementById('eyelight').onclick = e => {
    if (eyelight) {
      light.position = vec4(1.0, 1.0, 1.0, 1.0);
      eyelight = false;
    } else {
      light.position = vec4(0.0, 0.0, 0.0, 0.0);
      eyelight = true;
      rotatelight = false;
    }
  }
  document.getElementById('wireframe').onclick = e => {
    wireframe = !wireframe
  }
  document.getElementById('normals').onclick = e => {
    drawNormals = !drawNormals
  }
  document.getElementById('rotatelight').onclick = e => {
    if (rotatelight) {
      rotatelight = false;
      light.position = vec4(1.0, 1.0, 1.0, 1.0);
      lightangle = 0;
    } else {
      //HW470: Cannot turn on rotate light when eye follow light is on
      if (!eyelight) {
        rotatelight = true;
        lightradiusSlider.value = 2*10*dz;
        lightangle = 0;
      }
    }
  }
  document.getElementById('fov').onchange = e => {
    perspOptions.fovy = e.target.value;
    projMatrix = perspective(perspOptions.fovy, perspOptions.aspect, perspOptions.near, perspOptions.far);
  }


  // ===============================================================================
  // ========================== Camera control via mouse============================
  // ===============================================================================
  document.getElementById("gl-canvas").onmousedown = function (event)
  {
    if(event.button == 0 && !mouse.leftDown)
    {
      mouse.leftDown = true;
      mouse.prevX = event.clientX;
      mouse.prevY = event.clientY;
    }
    else if (event.button == 2 && !mouse.rightDown)
    {
      mouse.rightDown = true;
      mouse.prevX = event.clientX;
      mouse.prevY = event.clientY;
    }
  };

  document.getElementById("gl-canvas").onmouseup = function (event)
  {
    // Mouse is now up
    if (event.button == 0)
    {
      mouse.leftDown = false;
    }
    else if(event.button == 2)
    {
      mouse.rightDown = false;
    }

  };

  document.getElementById("gl-canvas").onmouseleave = function ()
  {
    // Mouse is now up
    mouse.leftDown = false;
    mouse.rightDown = false;
  };


  document.getElementById("gl-canvas").onmousemove = function (event)
  {
    // Get changes in x and y
    var currentX = event.clientX;
    var currentY = event.clientY;

    var deltaX = event.clientX - mouse.prevX;
    var deltaY = event.clientY - mouse.prevY;

    var makeChange = 0;

    //console.log("enter onmousemove");
    //console.log("viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);

    // Only perform actions if the mouse is down
    // Compute camera rotation on left click and drag
    if (mouse.leftDown)
    {
      //console.log("onmousemove and leftDown is true");
      makeChange = 1;

      // Perform rotation of the camera
      if (viewer.up[1] > 0)
      {
        viewer.theta -= 0.01 * deltaX;
        viewer.phi -= 0.01 * deltaY;
      }
      else
      {
        viewer.theta += 0.01 * deltaX;
        viewer.phi -= 0.01 * deltaY;
      }

      //console.log("increment theta=",viewer.theta,"  phi=",viewer.phi);

      // Wrap the angles
      var twoPi = 6.28318530718;
      if (viewer.theta > twoPi)
      {
        viewer.theta -= twoPi;
      }
      else if (viewer.theta < 0)
      {
        viewer.theta += twoPi;
      }

      if (viewer.phi > twoPi)
      {
        viewer.phi -= twoPi;
      }
      else if (viewer.phi < 0)
      {
        viewer.phi += twoPi;
      }
      // console.log("wrapped  theta=",viewer.theta,"  phi=",viewer.phi);

    }
    else if(mouse.rightDown)
    {
      //console.log("onmousemove and rightDown is true");
      makeChange = 1;
      // Perform zooming

      viewer.radius -= 0.01 * deltaX;

      viewer.radius = Math.max(0.1, viewer.radius);
    }

    if(makeChange == 1) {

      //console.log("onmousemove make changes to viewer");

      // Recompute eye and up for camera
      var threePiOver2 = 4.71238898;
      var piOver2 = 1.57079632679;

      var pi = 3.14159265359;

      var r = viewer.radius * Math.sin(viewer.phi + piOver2);


      viewer.eye = vec3(r * Math.cos(viewer.theta + piOver2), viewer.radius * Math.cos(viewer.phi + piOver2), r * Math.sin(viewer.theta + piOver2));

      //add vector (at - origin) to move 
      for(k=0; k<3; k++)
        viewer.eye[k] = viewer.eye[k] + viewer.at[k];

      //console.log("theta=",viewer.theta,"  phi=",viewer.phi);
      //console.log("eye = ",viewer.eye[0],viewer.eye[1],viewer.eye[2]);
      //console.log("at = ",viewer.at[0],viewer.at[1],viewer.at[2]);
      //console.log(" ");

      // move down -z axis ?????
      //viewer.eye[2] = viewer.eye[2] - viewer.radius;


      if (viewer.phi < piOver2 || viewer.phi > threePiOver2) {
        viewer.up = vec3(0.0, 1.0, 0.0);
      }
      else {
        viewer.up = vec3(0.0, -1.0, 0.0);
      }
      // console.log("up = ",viewer.up[0],viewer.up[1],viewer.up[2]);
      //console.log("update viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);
      // Recompute the view
      mvMatrix = lookAt(vec3(viewer.eye), viewer.at, viewer.up);


      mouse.prevX = currentX;
      mouse.prevY = currentY;
    }
    //console.log("exit onmousemove");
    //console.log("viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);


  };

  // ==============================================================================================
  // ==============================================================================================
  // ==============================================================================================
  // ========================== go to render
  //



  render();
}


// ========================================================================
// ========================= RENDER ======================================
// ===========================================================================

var render = function() {

  //HW470: If we are in the rotating light state, set the light's position based on the radius and angle,
  //and increment the angle
  if (rotatelight) {
    light.position = multMatVec(rotateY(lightangle), vec4(0,0,lightradiusSlider.value/10,1));
    lightangle += 0.5;
  }

  // HW470: rest, I'll comment but not type HW470 every time...
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // first we draw the shaded mesh
  gl.useProgram( program1 );

  // update mv/p matrices
  gl.uniformMatrix4fv(u_mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(u_projMatrixLoc, false, flatten(projMatrix));

  // update light position and shininess
  gl.uniform4fv(lightPositionLoc, flatten(light.position));
  gl.uniform1f(shininessLoc, shininessSlider.value);

  // make sure we bind the correct position buffer and its associated
  // attrib pointer/array
  gl.bindBuffer(gl.ARRAY_BUFFER, vPosBuff);
  gl.vertexAttribPointer( a_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( a_vertexPositionLoc );

  // bind the correct index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
  // draw!
  gl.drawElements( gl.TRIANGLES, activeObject.geometry.numTris * 3, gl.UNSIGNED_SHORT, 0 );

  if (wireframe) {
    // if wireframe is on, use program2..
    gl.useProgram( program2 );

    // update mv/p matrices
    gl.uniformMatrix4fv(basic_mvMatrixLoc, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(basic_projMatrixLoc, false, flatten(projMatrix));

    // bind correct position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vPosBuff);
    gl.vertexAttribPointer( basic_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( basic_vertexPositionLoc );

    // bind correct index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wireIndexBuf);
    // draw!
    gl.drawElements(gl.LINES, activeObject.geometry.numTris * 5, gl.UNSIGNED_SHORT, 0);
  }
  if (drawNormals) {
    //if normals are on, use program3
    gl.useProgram( program3 );

    // update mv/p matrices again..
    gl.uniformMatrix4fv(normal_mvMatrixLoc, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(normal_projMatrixLoc, false, flatten(projMatrix));

    // use the normals position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, normalPosBuff);
    gl.vertexAttribPointer( normal_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( normal_vertexPositionLoc );

    // draw our arrays, no index buffer this time
    gl.drawArrays(gl.LINES, 0, activeObject.geometry.normalDrawVerts.length);
  }

  //HW470: Draw the light, same description as above..

  gl.useProgram(program4);

  gl.uniformMatrix4fv(light_mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(light_projMatrixLoc, false, flatten(projMatrix));

  gl.bindBuffer( gl.ARRAY_BUFFER, lightPosBuff );
  gl.vertexAttribPointer( light_vertexPositionLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( light_vertexPositionLoc );

  gl.bufferData( gl.ARRAY_BUFFER, flatten(light.position), gl.DYNAMIC_DRAW );
  gl.drawArrays(gl.POINTS, 0, 1);

  requestAnimFrame(render); 
}
