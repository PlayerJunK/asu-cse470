// Gray Olson
// CSE 470
// CreateCubeHW2.js
// These are the cube vertices and cube definition that must be used for HW 2.
//
var vertices = [
	vec3( 0.0, 0.0,  0.0),
	vec3( 0.0, 1.0,  0.0 ),
	vec3( 1.0, 1.0,  0.0 ),
	vec3( 1.0, 0.0,  0.0 ),
	vec3( 0.0, 0.0, -1.0 ),
	vec3( 0.0, 1.0, -1.0),
	vec3( 1.0, 1.0, -1.0 ),
	vec3( 1.0, 0.0, -1.0 )
];

// HW470: Define face colors
var colors = [
    vec3( 0.6, 0.3, 0.2 ),
    vec3( 0.3, 0.6, 0.4 ),
    vec3( 0.4, 0.3, 0.6 ),
    vec3( 0.0, 0.4, 0.4 ),
    vec3( 0.8, 0.8, 0.8 ),
    vec3( 0.8, 0.4, 0.6 )
];
	
function createCube()
{
    // HW470 add color to each face
    quad( 1, 0, 3, 2, colors[0]);
    quad( 2, 3, 7, 6, colors[1] );
    quad( 3, 0, 4, 7, colors[2] );
    quad( 6, 5, 1, 2, colors[3] );
    quad( 4, 5, 6, 7, colors[4] );
    quad( 5, 4, 0, 1, colors[5] );
	
}

// HW470: Add color parameter to quad to color all the vertices that color
function quad(a, b, c, d, color) 
{

    // We need to partition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
      // HW470: Add final data to staticData object
      staticData.vertices.push( vertices[indices[i]] );
      // HW470: Add given color to colors data
      staticData.colors.push(color);
        
    }
}
