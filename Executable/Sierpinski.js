//In this code I took a look at example files of book provided at Dr.Güdükbay's website.
//It was mainly used to understand the buffers and shaders in webGL
//I used gasket5.html and gasket5.js to learn the usegae of sliders.
//Additionally js and html components such as buttons and colors pickers were reasearched and learned from https://www.w3schools.com/

var gl;
var points = [];
var colors = [0.1, 0.0, 1, 1];
var recursiveSteps = 1;
var primitiveType;
var foreGroundColor = [0, 0.9098, 0.149, 1];
var backGroundColor = [0,0,0,1];
var trackMouse = false;
var loading = false;

// initial 2 Vertices        
var vertices = [
    vec2(-0.33, -0.33),
    vec2(0.33, 0.33),]

function init(){
    var canvas = document.getElementById( "gl-canvas" );
     gl = WebGLUtils.setupWebGL( canvas );    
     if ( !gl ) { alert( "WebGL isn't available" ); 
    }        

divideRectangles(vertices[0], vertices[1], recursiveSteps);

//  Configure WebGL   
//    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( backGroundColor[0], backGroundColor[1], backGroundColor[2], backGroundColor[3]);   
     
//  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );        

//loop up for vertex data        
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    var vColor = gl.getAttribLocation( program, "vColor");

//Create vertices buffer
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

//Create color buffer
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );


//
    gl.enableVertexAttribArray( vPosition );
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(vColor);
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, true, 0, 0);


    // Initialize event handlers
    //slider
    document.getElementById("slider").onchange = function() 
    {
        recursiveSteps =  event.srcElement.value;
        console.log(recursiveSteps);
    };

    //radios
    var radios = document.getElementsByName('drawMethod');
    if (radios[0].checked) 
    {
        primitiveType = gl.LINE_LOOP;
    }
    else /*if (radios[1].checked)*/
    {
        primitiveType = gl.TRIANGLE_FAN;
    }
    
    //colorpickers
    //foreGround
    var foreGroundColorPicker = document.getElementById("fColor");
    foreGroundColorPicker.onchange = function() {
        foreGroundColor = hexToRGB(foreGroundColorPicker.value);
    }

    //background
    var backGroundColorPicker = document.getElementById("bColor");
    backGroundColorPicker.onchange = function(){
        backGroundColor = hexToRGB(backGroundColorPicker.value);
    }

    //mouse events
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("mousemove", mouseMove);

    var vertex1;
    //gets the first point to our initial rectangle
    function mouseDown(event)
    {
        vertex1 = vec2(2*event.clientX/canvas.width-1, 
           2*(canvas.height-event.clientY)/canvas.height-1);
        vertices[0] = vertex1;
        vertices[1] = vertex1;
        trackMouse = true;
        
    };
    //Interactively tracks mouse with second vertex while first vertex is fixed
    function mouseMove(event)
    {
        if(trackMouse)
        {
            var vertex2= vec2(2*event.clientX/canvas.width-1, 
                2*(canvas.height-event.clientY)/canvas.height-1);
            //rectangle method requires vertices to be left bottom and rigth top
            //calculations will be made to transform these vertices
            var properVertices = transformVertices(vertex1, vertex2);
            vertices[0] = properVertices[0]
            vertices[1] = properVertices[1]
        }
    }

     //fixes the second point of the rectangle
    function mouseUp(event)
    {
        trackMouse = false;
     };

     //Save/Load buttons
     var saveButton = document.getElementById("saveButton")
     var loadButton = document.getElementById("loadButton")
     
     saveButton.onclick = function(){
        var text;
        var filename = "SierpinskiCarpet.txt";

        text = vertices[0] + "\n" + vertices[1] + "\n" + foreGroundColor + "\n" 
        + backGroundColor + "\n" + recursiveSteps + "\n" + primitiveType

        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

        download("carpet.txt", "");
      
     };

     loadButton.onchange = function(event){
        var file = event.target.files[0]; // File object

        var reader = new FileReader();
        reader.onload = function(progressEvent){

            var lines = this.result.split('\n');
            vertices[0] = textToList(lines[0]);
            vertices[1] = textToList(lines[1]);

            foreGroundColor = textToList(lines[2]);;
            backGroundColor = textToList(lines[3]);

            recursiveSteps = lines[4];
            document.getElementById("slider").value = recursiveSteps

            radios[0].checked = false;
            radios[1].checked = false;
            primitiveType = parseInt(lines[5]) == gl.TRIANGLE_FAN ? radios[1].checked = true : radios[0].checked = true;
        };
        reader.readAsText(file);
     };


    render();
};

//Recursive function to divide up the canvas and determine the vertex locations
function divideRectangles(a, b, remainingSteps)
{
    if(remainingSteps ==0)
        return;//fix
        //rectangle(a, b);
    else
    {
        rectangle(a, b);
        remainingSteps--;

        var xLen = Math.abs(a[0] - b[0]);
        var yLen = Math.abs(a[1] - b[1]);

        xLen /= 3;
        yLen /= 3;

        //from bottom left corner clockwise direction calculating all vertices for all subrectangles
        //3   4   5
        //2   c   6
        //1   8   7

        //1-------------------------------------------------
        var va = new vec2(a[0] - 2 * xLen, a[1] - 2 * yLen);
        var vb = new vec2(a[0] - xLen, a[1] - yLen);
        divideRectangles (va, vb, remainingSteps);
        //2-------------------------------------------------
        va = new vec2(a[0] - 2 * xLen, a[1] + yLen);
        vb = new vec2(a[0] - xLen, b[1] - yLen);
        divideRectangles (va, vb, remainingSteps);
        //3-------------------------------------------------
        va = new vec2(a[0] - 2 * xLen, b[1] + yLen);
        vb = new vec2(a[0] - xLen, b[1] + 2 * yLen);
        divideRectangles (va, vb, remainingSteps);
        //4-------------------------------------------------
        va = new vec2(a[0] + xLen, b[1] + yLen);
        vb = new vec2(b[0] - xLen, b[1] + 2 * yLen);
        divideRectangles (va, vb, remainingSteps);
        //5-------------------------------------------------
        va = new vec2(b[0] + xLen, b[1] + yLen);
        vb = new vec2(b[0] + 2 * xLen, b[1] + 2 * yLen);
        divideRectangles (va, vb, remainingSteps);
        //6-------------------------------------------------
        va = new vec2(b[0] + xLen,  a[1] + yLen);
        vb = new vec2(b[0] + 2 * xLen,b[1] - yLen);
        divideRectangles (va, vb, remainingSteps);
        //7-------------------------------------------------
        va = new vec2(b[0] + xLen, a[1] - 2 * yLen);
        vb = new vec2(b[0] + 2 * xLen, a[1] - yLen);
        divideRectangles (va, vb, remainingSteps);
        //8------------------------------------------------
        va = new vec2(a[0] + xLen, a[1] - 2 * yLen);
        vb = new vec2(b[0] - xLen, a[1] - yLen);
        divideRectangles (va, vb, remainingSteps);

    }
}
window.onload = init;

//draws a rectangle using the diagonal line
function rectangle(a, b)
{
    points.push(a);
    colors.push( foreGroundColor)
    points.push(new vec2(a[0], b[1]));
    colors.push( foreGroundColor)
    points.push(b);
    colors.push( foreGroundColor)
    points.push(new vec2(b[0], a[1]));
    colors.push( foreGroundColor)
}

//https://stackoverflow.com/questions/4262417/jquery-hex-to-rgb-calculation-different-between-browsers
function hexToRGB(hexStr){
    // note: hexStr should be #rrggbb
    var hex = parseInt(hexStr.substring(1), 16);
    var r = (hex & 0xff0000) >> 16;
    var g = (hex & 0x00ff00) >> 8;
    var b = hex & 0x0000ff;
    return new vec4(r/255, g/255, b/255, 1);
}


function textToList(text)
{
    var values = text.split(',');
    var rtn = [];
    for(i = 0; i< values.length; i++)
        rtn.push(parseFloat(values[i]))

    return rtn;
}

function transformVertices(vertex1, vertex2)
{
    //4 cases 1 of which is accepted by rectangle method
    var x1 = vertex1[0]
    var y1 = vertex1[1]
    var x2 = vertex2[0]
    var y2 = vertex2[1]

    if (x1 > x2 && y1 > y2)
        return [new vec2(x2, y2), new vec2(x1, y1)];

    else if (x1 > x2 && y2 > y1)
        return [new vec2(x2, y1), new vec2(x1, y2)];

    else if (x2 > x1 && y1 > y2)
        return [new vec2(x1, y2), new vec2(x2, y1)];
    else
        return [new vec2(x1, y1), new vec2(x2, y2)];
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    for(i = 0; i <points.length; i+=4)
        gl.drawArrays( primitiveType, i, 4);

    points = [];
    colors = [];
    requestAnimFrame(init);
}