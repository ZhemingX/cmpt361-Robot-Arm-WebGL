"use strict";

var canvas, gl, program;

var NumVerticesCube = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)
var NumVerticesCyl = 720; //(60 + 60 + 120) * 3 = 720
var NumVerticesSphere = 1536;
var points = [];
var colors = [];
var normals = []; //vec3 normal for each vertex

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

var cube_normals = [
    vec3(0.0, 0.0, 1.0),
    vec3(1.0, 0.0, 0.0),
    vec3(0.0 -1.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, -1.0),
    vec3(-1.0, 0.0, 0.0)
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];


// Parameters controlling the size of the Robot's arm

var BASE_HEIGHT      = 0.5;
var BASE_RADIUS      = 1.0;
var LOWER_ARM_HEIGHT = 2.0;
var LOWER_ARM_WIDTH  = 0.3;
var UPPER_ARM_HEIGHT = 2.0;
var UPPER_ARM_WIDTH  = 0.3;
var RADIUS           = 0.15;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;


var theta= [ 0, 0, 0];

var angle = 0;

var modelViewMatrixLoc, normalMatLoc, projectionMatrixLoc;

var vBuffer, cBuffer, nBuffer; //for cube and cyl and sphere
var vColor, vPosition, vNormal;

//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d, color, normal_id) {
    colors.push(vertexColors[color]);
    points.push(vertices[a]);
    normals.push(cube_normals[normal_id]);
    colors.push(vertexColors[color]);
    points.push(vertices[b]);
    normals.push(cube_normals[normal_id]);
    colors.push(vertexColors[color]);
    points.push(vertices[c]);
    normals.push(cube_normals[normal_id]);
    colors.push(vertexColors[color]);
    points.push(vertices[a]);
    normals.push(cube_normals[normal_id]);
    colors.push(vertexColors[color]);
    points.push(vertices[c]);
    normals.push(cube_normals[normal_id]);
    colors.push(vertexColors[color]);
    points.push(vertices[d]);
    normals.push(cube_normals[normal_id]);
}


function colorLowerCube() {
    quad( 1, 0, 3, 2, 1, 0);
    quad( 2, 3, 7, 6, 1, 1);
    quad( 3, 0, 4, 7, 1, 2);
    quad( 6, 5, 1, 2, 1, 3);
    quad( 4, 5, 6, 7, 1, 4);
    quad( 5, 4, 0, 1, 1, 5);
}

function colorUpperCube() {
    quad( 1, 0, 3, 2, 4, 0);
    quad( 2, 3, 7, 6, 4, 1);
    quad( 3, 0, 4, 7, 4, 2);
    quad( 6, 5, 1, 2, 4, 3);
    quad( 4, 5, 6, 7, 4, 4);
    quad( 5, 4, 0, 1, 4, 5);
}

//____________________________________________

//-------------cylinder-----------------------------
var cylinder_circle_color = 3;
var cylinder_surface_color = 3;

function CirclePoints(y) {
    var divNum = 60;
    var srad = 2.0 * Math.PI / divNum;
    var vecs = [];
    for(var i = 0; i < divNum; i++) {
        var curangle = i * srad;
        vecs.push(vec4(0.5 * Math.cos(curangle), y, 0.5 * Math.sin(curangle), 1.0));
    }
    vecs.push(vecs[0]);
   return vecs;
}

function squared(pa, pb, pc, pd, pcolor, up_center, low_center) {
    colors.push(vertexColors[pcolor]);
    points.push(pa);
    normals.push(vec3(subtract(pa, up_center)));

    colors.push(vertexColors[pcolor]);
    points.push(pb);
    normals.push(vec3(subtract(pb, up_center)));

    colors.push(vertexColors[pcolor]);
    points.push(pc);
    normals.push(vec3(subtract(pc, low_center)));

    colors.push(vertexColors[pcolor]);
    points.push(pa);
    normals.push(vec3(subtract(pa, up_center)));

    colors.push(vertexColors[pcolor]);
    points.push(pc);
    normals.push(vec3(subtract(pc, low_center)));

    colors.push(vertexColors[pcolor]);
    points.push(pd);
    normals.push(vec3(subtract(pd, low_center)));
}

function colorCylinder() {
    var top_p = vec4(0.0, 0.5, 0.0, 1.0);
    var bot_p = vec4(0.0, -0.5, 0.0, 1.0);
    var top_cirp = CirclePoints(0.5);
    var bot_cirp = CirclePoints(-0.5);
    //upload cylinder surface's points and colors
    for(var i = 0; i < top_cirp.length - 1; i++) {
        squared(top_cirp[i + 1], top_cirp[i], bot_cirp[i], bot_cirp[i + 1], cylinder_surface_color, top_p, bot_p);
    }
    //upload two circles' points and colors
    for(var i = 0; i < top_cirp.length - 1; i++) {
        points.push(top_cirp[i]);
        colors.push(vertexColors[cylinder_circle_color]);
        normals.push(vec3(0.0, 1.0, 0.0));
        points.push(top_p);
        colors.push(vertexColors[cylinder_circle_color]);
        normals.push(vec3(0.0, 1.0, 0.0));
        points.push(top_cirp[i + 1]);
        colors.push(vertexColors[cylinder_circle_color]);
        normals.push(vec3(0.0, 1.0, 0.0));
    }
    for(var i = 0; i < bot_cirp.length - 1; i++) {
        points.push(bot_cirp[i]);
        colors.push(vertexColors[cylinder_circle_color]);
        normals.push(vec3(0.0, -1.0, 0.0));
        points.push(bot_p);
        colors.push(vertexColors[cylinder_circle_color]);
        normals.push(vec3(0.0, -1.0, 0.0));
        points.push(bot_cirp[i + 1]);
        colors.push(vertexColors[cylinder_circle_color]);
        normals.push(vec3(0.0, -1.0, 0.0));
    }
}

//-------------sphere-------------------------------
var sphere_vertices = [];

var sphereColor = vec4(1.0, 0.0, 0.0, 1.0); // red ball
var DIV_TIME = 16;

function push_sphere_vertices() {
    for(var row = 0; row <= DIV_TIME; row++) {
        var theta = row * Math.PI / DIV_TIME - Math.PI / 2;
        var sin_theta = Math.sin(theta);
        var cos_theta = Math.cos(theta);
        for(var col = 0; col <= DIV_TIME; col++) {
            var beta = col * 2 * Math.PI / DIV_TIME - Math.PI;
            var sin_beta = Math.sin(beta);
            var cos_beta = Math.cos(beta);
            var x = cos_theta * cos_beta;
            var y = cos_theta * sin_beta;
            var z = sin_theta;
            sphere_vertices.push(vec4(x, y, z, 1.0));
        }
    }
}

function colorSphere() {

    push_sphere_vertices();

    for (var i = 0; i < DIV_TIME; i++) {
        for (var j = 0; j < DIV_TIME; j++) {
            var first = i * (DIV_TIME + 1) + j;
            var second = first + DIV_TIME + 1;
            points.push(sphere_vertices[first]);
            normals.push(vec3(sphere_vertices[first]));
            points.push(sphere_vertices[second]);
            normals.push(vec3(sphere_vertices[second])); 
            points.push(sphere_vertices[first + 1]);
            normals.push(vec3(sphere_vertices[first + 1])); 
            points.push(sphere_vertices[first + 1]); 
            normals.push(vec3(sphere_vertices[first + 1]));
            points.push(sphere_vertices[second]); 
            normals.push(vec3(sphere_vertices[second]));
            points.push(sphere_vertices[second + 1]);
            normals.push(vec3(sphere_vertices[second + 1]));
            for(var k = 0; k < 6; k++) {
                colors.push(sphereColor);
            } 
        }
    }
}

//_________________________________________________
// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

var topLookAtVec = lookAt(vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, -1.0));
var oldPos, newPos;
var optAngleOld, optAngleNew;
var sphereModelViewMatrix;
//--------------------------------------------------

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram( program );

    colorCylinder();
    colorLowerCube();
    colorUpperCube();
    ///*
    colorSphere();
    //*/
    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    vNormal = gl.getAttribLocation(program, "normal" );
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
    
    document.getElementById("slider1").onchange = function(event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").onchange = function(event) {
         theta[1] = event.target.value;
    };
    document.getElementById("slider3").onchange = function(event) {
         theta[2] =  event.target.value;
    };
    document.getElementById("fetch").onclick = function(event) {
        
        var old_x = document.getElementById("old_x").value;
        var old_y = document.getElementById("old_y").value;
        var old_z = document.getElementById("old_z").value;
        oldPos = vec3(old_x, old_y, old_z);
        
        var new_x = document.getElementById("new_x").value;
        var new_y = document.getElementById("new_y").value;
        var new_z = document.getElementById("new_z").value;
        newPos = vec3(new_x, new_y, new_z);

        flag = true;
        optAngleOld = getOptAngles(oldPos);
        optAngleNew = getOptAngles(newPos);
        tmp_angle1 = 0;
        tmp_angle2 = 0;
        tmp_angle3 = 0;
        _fetch = true;
        _hold = false;
        _return = false;
        _relief = false;
        flag = false;
        fetch_render();
    };

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatLoc = gl.getUniformLocation(program, "normalMat");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    projectionMatrix = ortho(-5, 5, -5, 5, -5, 5);
    var view_check = document.getElementsByName("view_check");
    view_check[0].onclick = function() {
        projectionMatrix = ortho(-5, 5, -5, 5, -5, 5);
        projectionMatrix = mult(projectionMatrix, topLookAtVec);
        gl.uniformMatrix4fv( projectionMatrixLoc,  false, flatten(projectionMatrix) );
    }
    view_check[1].onclick = function() {
        projectionMatrix = ortho(-5, 5, -5, 5, -5, 5);
        gl.uniformMatrix4fv( projectionMatrixLoc,  false, flatten(projectionMatrix) );
    }
    gl.uniformMatrix4fv( projectionMatrixLoc,  false, flatten(projectionMatrix) );

    render();
}

//----------------------------------------------------------------------------


function base() {
    var s = scale4(BASE_RADIUS, BASE_HEIGHT, BASE_RADIUS);
    var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    var normalMat = transpose(inverse4(modelViewMatrix));
    gl.uniformMatrix4fv(normalMatLoc, false, flatten(normalMat));
    gl.drawArrays( gl.TRIANGLES, 0, NumVerticesCyl );
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale4(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    var normalMat = transpose(inverse4(modelViewMatrix));
    gl.uniformMatrix4fv(normalMatLoc, false, flatten(normalMat));
    gl.drawArrays( gl.TRIANGLES, NumVerticesCyl + NumVerticesCube, NumVerticesCube );
}

//----------------------------------------------------------------------------


function lowerArm()
{
    var s = scale4(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
    var normalMat = transpose(inverse4(modelViewMatrix));
    gl.uniformMatrix4fv(normalMatLoc, false, flatten(normalMat));
    gl.drawArrays( gl.TRIANGLES, NumVerticesCyl, NumVerticesCube );
}


function sphere()
{   
    var s = scale4(RADIUS, RADIUS, RADIUS);
    var instanceMatrix = mult( translate( 0.0, 0.0, 0.0 ), s);
    var t = mult(sphereModelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
    var normalMat = transpose(inverse4(sphereModelViewMatrix));
    gl.uniformMatrix4fv(normalMatLoc,  false, flatten(normalMat) );
    gl.drawArrays(gl.TRIANGLES, NumVerticesCyl + NumVerticesCube * 2, NumVerticesSphere);
}
//----------------------------------------------------------------------------


var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
   
    modelViewMatrix = rotate(theta[Base], 0, 1, 0 );
    base();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], 0, 0, 1 ));
    lowerArm();

    modelViewMatrix  = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix  = mult(modelViewMatrix, rotate(theta[UpperArm], 0, 0, 1) );
    upperArm();

    requestAnimFrame(render);
}

var tmp_angle1 = 0;
var tmp_angle2 = 0;
var tmp_angle3 = 0;
var _fetch, _hold, _return, _relief; //states for fetch process
var flag = false;

function getOptAngles(pos) {
    //rotate angle1 for base
    var v1 = normalize(vec2(pos[0], pos[2]));
    var v2 = vec2(-1.0, 0.0);
    var a1 = Math.acos(dot(v1, v2)) * 180 / Math.PI;
    if(pos[2] < 0.0){
        a1 = 360 - a1;
    }
    //rotate angle2 for upper arm
    var toSphere = subtract(vec3(pos), vec3(0.0, 0.5, 0.0));
    var dist = length(toSphere);
    var cos_angle2 = (8 -dist * dist) / 8;
    var a2 = 180 - Math.acos(cos_angle2) * 180 / Math.PI;

    //rotate angle3 for lower arm
    var cos_toSphereOldToY = dot(normalize(toSphere), vec3(0.0, 1.0, 0.0));
    var a3 = Math.acos(cos_toSphereOldToY) * 180 / Math.PI - a2 / 2;

    return vec3(a1, a2, a3);
}

var fetch_render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );    

    if((optAngleOld[0] - tmp_angle1 >= optAngleOld[0] / 50) && _fetch){
        tmp_angle1 += (optAngleOld[0] / 50);
        tmp_angle2 += (optAngleOld[1] / 50);
        tmp_angle3 += (optAngleOld[2] / 50);
    }

    if((optAngleOld[0] - tmp_angle1 < optAngleOld[0] / 50) && _fetch){
        _fetch = false;
        _hold = true;
    }

    if((tmp_angle1 > optAngleOld[0] / 50) && _hold){
        tmp_angle1 -= (optAngleOld[0] / 50);
        tmp_angle2 -= (optAngleOld[1] / 50);
        tmp_angle3 -= (optAngleOld[2] / 50);
    }
    
    if((tmp_angle1 <= optAngleOld[0] / 50) && _hold){
        _hold = false;
        _return = true;
    }

    if((optAngleNew[0] - tmp_angle1 >= optAngleNew[0] / 50) && _return){
        tmp_angle1 += (optAngleNew[0] / 50);
        tmp_angle2 += (optAngleNew[1] / 50);
        tmp_angle3 += (optAngleNew[2] / 50);
    }

    if((optAngleNew[0] - tmp_angle1 < optAngleNew[0] / 50) && _return){
        _return = false;
        _relief = true;
    }
    
    if(_relief){
        tmp_angle1 = 0;
        tmp_angle2 = 0;
        tmp_angle3 = 0;
    }

    modelViewMatrix = rotate(tmp_angle1, 0, 1, 0 );
    base();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(tmp_angle3, 0, 0, 1 ));
    lowerArm();

    modelViewMatrix  = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix  = mult(modelViewMatrix, rotate(tmp_angle2, 0, 0, 1) );
    upperArm();

    //choose sphere view model
    if(_fetch){
        sphereModelViewMatrix = translate(oldPos);
        sphere();
    }
    else if(_relief){
        sphereModelViewMatrix = translate(newPos);
        sphere();
        if(flag){
            return;
        }
    }
    else{
        sphereModelViewMatrix = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT, 0.0));
        sphere();
    }

    //sphere();
    requestAnimFrame(fetch_render);

}

