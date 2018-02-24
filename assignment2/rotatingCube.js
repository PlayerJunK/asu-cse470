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

// HW470: Create a Transform type that will allow easy ability to rotate and translate a cube instance
function Transform(x,y,z) {
    this.rotation = rotateX(0)
    this.center = translate(-0.5,-0.5,0.5)
    this.translation = translate(x,y,z)
    this.transform = translate(0,0,0)
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

// HW470: Function to multiply a 4d matrix with a 4d vector
function mult4(mat, vec) {
    var result = [];
    for ( var i = 0; i < vec.length; ++i ) {
        var innerSum = 0;
        for (var j = 0; j < mat[i].length; ++j) {
            innerSum += vec[i] * mat[i][j];
        }
        result.push(innerSum);
    }
    return result;
}

// HW470: Function to add a cube to the cubeInstances array and log information about it
function addCube(cube) {
    // Add to cube instances
    cubeInstances.push(cube)
    // HW470: Set all cubes' scales properly
    var numCubes = cubeInstances.length;
    cubeInstances.forEach(cube => {
        cube.transform.setScale(1/numCubes);
    })

    var center = {
        x: cube.transform.translation[0][3],
        y: cube.transform.translation[1][3],
        z: cube.transform.translation[2][3]
    };
    var scale = cube.transform.scaling[0][0];
    console.log('New cube!')
    console.log(`Center: (${center.x}, ${center.y}, ${center.z})`)
    console.log(`Angle: 0`)
    console.log(`Scale: ${scale}`)
    console.log(`Speed: ${cube.speed}`)
}

function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
        
    // HW470: initialize data
    createCube(vertices, colors);

    //
    //  Configure WebGL
    //
    // HW470: Change clear color and enable depth testing
    gl.clearColor( 0.21, 0.2, 0.25, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    // HW470: Initialize Position and Color buffers
    // Create vertex position buffer and send initial data
    var vPosBuff = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vPosBuff );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(staticData.vertices), gl.STATIC_DRAW );

    // Associate vPosition attribute in shader to the buffer
    var vPosLoc = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosLoc );

    // Create vertex color buffer and send initial data
    var vColorBuff = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vColorBuff );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(staticData.colors), gl.STATIC_DRAW );

    // Associate vColor attribute in shader to the buffer
    var vColLoc = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColLoc );

    // HW470: initialize and set up uniform locations
    uProjLoc = gl.getUniformLocation( program, "uProjection" );
    uModelViewLoc = gl.getUniformLocation( program, "uModelView" );
    // HW470: Setup ortho projection matrix based on canvas aspect ratio
    var aspect = canvas.width/canvas.height;
    var proj = ortho(-1 * aspect, 1 * aspect, -1, 1, -10, 10);
    // HW470: Create inverse projection for use later
    var inverseProj = inverse4(proj);
    // HW470: Setup initial cube's model matrix
    addCube({
        transform: new Transform(0,0,0),
        speed: Math.random() * 2 - 1
    })
    // HW470: Send initial data to uniforms
    gl.uniformMatrix4fv(uProjLoc, false, flatten(proj));
    gl.uniformMatrix4fv(uModelViewLoc, false, flatten(cubeInstances[0].transform.getTransform()));

    // HW470: Setup click event
    canvas.onclick = (e) => {
        // HW470: First get canvas-relative pixel coordinates of the click
        var screenx = e.pageX - canvas.offsetLeft;
        var screeny = canvas.height - (e.pageY - canvas.offsetTop);
        // HW470: then normalize them to OGL -1, 1 space
        var normx = 2 * (screenx / canvas.width) - 1;
        var normy = 2 * (screeny / canvas.height) - 1;
        // HW470: Unproject normalized coordinates using inverse projection matrix
        var projected = mult4(inverseProj, vec4(normx, normy, 0, 1));
        // HW470: Randomize z from -0.5, 0.5
        projected[2] = Math.random() - 0.5;
        // HW470: Add new cube instance
        addCube({
            transform: new Transform(projected[0], projected[1], projected[2]),
            // HW470: Random speed between -1 and 1
            speed: Math.random() * 2 - 1
        })

    }

    // HW470: Setup rotation buttons
    document.getElementById('rotatex').onclick = e => {
        rotationAxis = xAxis
    }
    document.getElementById('rotatey').onclick = e => {
        rotationAxis = yAxis
    }
    document.getElementById('rotatez').onclick = e => {
        rotationAxis = zAxis
    }
    document.getElementById('rotaterand').onclick = e => {
        rotationAxis = vec3(Math.random(), Math.random(), Math.random())
    }

    // HW470: Start render loop
    render();
}

window.onload = init

function render()
{
    // HW470 clear color and depth buffers
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    // HW470 Draw each cube instance
    cubeInstances.forEach(cube => {
        // HW470: First we rotate this cube around the rotation axis by its speed
        cube.transform.rotate(cube.speed, rotationAxis);
        // HW470: Then recompute the transform matrix
        cube.transform.computeTransform();
        // HW470: Send the new data to the gpu in the modelview uniform
        gl.uniformMatrix4fv(uModelViewLoc, false, flatten(cube.transform.getTransform()));
        // HW470: Draw the static verticies transformed by the matrix
        gl.drawArrays( gl.TRIANGLES, 0, staticData.vertices.length );
    })
    // HW470: Get next availale frame and run this function again
    window.requestAnimationFrame(render);
}

