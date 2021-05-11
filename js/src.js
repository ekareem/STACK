let scene;
let camera;
let renderer;
let controls;
let world;

const initWidth = 3;
const initLength = 3;
const height = 1;
const speed = 0.1;

let currentColor;
let camposb4;
let camrotb4;

let stack = [];
let overlaps = [];

var isStarted = false;
var isPaused = false;

//creaes random colors
randomColor = () => {

    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) 
      color += letters[Math.floor(Math.random() * 16)];
    return color;
}
 
//generates a box
generateBox = (x,y,z,width,length,direction,mass,color)=>{
    const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, length/2));
    const rigidboy = new CANNON.Body({mass, shape});
    rigidboy.position.set(x,y,z);
    world.addBody(rigidboy);

    const geometry = new THREE.BoxGeometry(width,height,length);
    const material = new THREE.MeshLambertMaterial({color : color});
    const model = new THREE.Mesh( geometry, material);
    model.position.set(x,y,z);
    scene.add(model);

    return {
        three: model,
        cannon: rigidboy,
        width,
        length,
        direction
    }
}

addToStack = (x,z,width,length,direction) =>{
    const y = height * stack.length;
    currentColor =  randomColor()
    const layer = generateBox(x,y,z,width,length,direction,0,currentColor);
    stack.push(layer);
}

addOverLap = (x,z,width,length) =>{
    const y = height * (stack.length - 1);
    const overlap = generateBox(x,y,z,width,length,'x',5,currentColor);
    overlaps.push(overlap);
}

init = () => {
    //set up cannonjs world
    world = new CANNON.World();
    world.gravity.set(0,-7,0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 60;

    //set up cannon js scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100000 );
    camposb4 = camera.position.clone();
    camrotb4 = camera.rotation.clone();

    camera.position.set(5,height * (stack.length - 2) + 4,5);
    camera.lookAt(0,0,0);

    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //orbit controls
    controls =  new THREE.OrbitControls(camera,renderer.domElement);
    controls.enabled = false;
    
    lighting();
    createSkyBox();

    addToStack(0,0,initWidth,initLength);
    addToStack(-10,0,initWidth,initLength,"x");
}

// set up lighting
lighting = () => {
    //ambient light
    const ambient = new THREE.AmbientLight( 0xffffff,0.6);
    scene.add(ambient);
    
    //directional light
    const directional = new THREE.DirectionalLight(0xffffff,0.6);
    directional.position.set(10,20,0);
    scene.add(directional);
}

//create sky box
createSkyBox = () => {

    //skybox geometry
    const skyboxGeometry = new THREE.BoxGeometry(10000,10000,10000);
    //skybox material
    var skyboxMaterial = [
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("texture/front.png"),side : THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load("texture/back.png"),side : THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load("texture/leftr.png"),side : THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load("texture/rightr.png"),side : THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load("texture/bottom.png"),side : THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map:new THREE.TextureLoader().load("texture/top.png"),side : THREE.DoubleSide}),
    ];
    const skyboxMesh = new THREE.Mesh( skyboxGeometry, skyboxMaterial);
    skyboxMesh.position.set(0,0,0);
    scene.add(skyboxMesh);
}

//moves boxes
animation = () => {
    const top = stack[stack.length - 1];
    top.three.position[top.direction] += speed;
    top.cannon.position[top.direction] += speed;

    if (camera.position.y < height * (stack.length - 2) + 4)  camera.position.y += speed;
    updatePhysics();
}

$( ".button" ).click(function() {
    onpause();
});

$( "#outer-circle" ).click(function() {
    restart();
});

$( "#start" ).click(function() {
    onpause();
});

//inputs
window.addEventListener("keyup",(event) => {
    if (event.key == 'p')
        onpause();
    if(event.key == 'r') 
        restart();
    if(event.keyCode == 32) // space
        checkoverlap()
})


//match three js to cannon js
updatePhysics = () => {
    world.step(1/60);
    overlaps.forEach((element) => {
        element.three.position.copy(element.cannon.position);
        element.three.quaternion.copy(element.cannon.quaternion);
    });
}

update = () =>{ 

    if(isStarted && !isPaused){
        renderer.setAnimationLoop(animation);
    }
    else{
        renderer.setAnimationLoop(null)
    }

    buttonisplay  =$('.button').hasClass('play');
    if(isPaused  )
    {
        $('.button').removeClass('pause').addClass('play');
    }
     else if(!isPaused)
    { 
        $('.button').removeClass('play').addClass('pause');
    }

    $('#score').text(stack.length - 1);

    if(isStarted)
    {
        $('#instruction').css({"display":"none"});
        $('#report').css({"display":"inline"});
        $('#report').text("YOU STACKED "+(stack.length-1)+" BOXES") 
    }
    else
    {
        $('#instruction').css({"display":"inline"});
    }

};

checkoverlap = () =>{
    if(!isStarted){
        isStarted = true;
    }
    if(isPaused){
        
    } 
    else {
 
        const top = stack[stack.length - 1];
        const prev = stack[stack.length -2];
        const direction = top.direction;

        const delta = top.three.position[direction] - prev.three.position[direction];
        const overlapSize  = Math.abs(delta);
        const size  = direction == 'x' ? top.width : top.length;
        const overlap = size - overlapSize;

        if (overlap > 0){
            const newWidth =direction == 'x' ? overlap : top.width;
            const newLength = direction == 'z' ? overlap : top.length;

            top.width = newWidth;
            top.length = newLength;

            top.three.scale[direction] = overlap / size;
            top.three.position[direction] -= delta / 2;

            top.cannon.position[direction] -= delta / 2;
            const shape = new CANNON.Box(new CANNON.Vec3(newWidth/2,height/2,newLength/2));
            top.cannon.shape = [];
            top.cannon.addShape(shape)

            //overlap
            const overlapShift = (overlap / 2 + overlapSize / 2) * Math.sign(delta);
            const overlapX = direction == 'x' ? top.three.position.x + overlapShift : top.three.position.x;
            const overlapZ = direction == 'z' ? top.three.position.z + overlapShift : top.three.position.z;
            
            const overlapWidth = direction == 'x' ? overlapSize : top.width;
            const overlapLength = direction == 'z' ? overlapSize : top.length;
                
            addOverLap(overlapX,overlapZ,overlapWidth,overlapLength);

            const nextX = direction == 'x' ? top.three.position.x : -10;
            const nextZ = direction == 'z' ? top.three.position.z : -10;
            const nextDirection = direction == 'x' ? 'z' : 'x';
            
            addToStack(nextX, nextZ, top.width, top.length, nextDirection)
        }
        else{
            reset();
        }
        
        if (overlapSize == 0){
            top.width += direction == 'z' ? 1 : 0;
            top.length += direction == 'x' ? 1: 0;
            addToStack(nextX, nextZ, top.width , top.length , nextDirection)
        }

    }
}


// raw Scence
var render = function()
{
    renderer.render(scene, camera);
}

//run game lop (update, render, repeat)
var GameLoop = function()
{
    //console.log(isPaused)
    requestAnimationFrame( GameLoop );

    update();
    render();
}


//pasused the game and allows for camera movements
onpause = () => {
    if (!isStarted)
    {
        isStarted = true;
        return;
    }
    if(isPaused){
        isPaused = !isPaused;
        controls.enabled = false;
        
        camera.position.copy(camposb4);
        camera.rotation.copy(camrotb4);
    
    }
    else{
        camposb4.copy(camera.position);
        camrotb4.copy(camera.rotation);
        isPaused = !isPaused;
        controls.enabled = true;
    }
};

//restarts the game
restart = () => {
    if(isStarted)
    {
        var r = confirm("Are you sure you want to restart?")
        if (r == true) {
            reset();
        }
    }
}

//resets the gmae
reset = () => {
    isStarted = false;
    isPaused = false;
    removeObjects();
    stack = [];
    overlaps = [];
    camera.position.set(5,height * (stack.length - 2) + 4,5);
    camera.lookAt(0,0,0);
    addToStack(0,0,initWidth,initLength);
    addToStack(-10,0,initWidth,initLength,"x");
}

//removes object from three js and cannon js
removeObjects = () => {
    stack.map((mesh) => {
        scene.remove(mesh.three);
        world.remove(mesh.cannon)
    })
    overlaps.map((mesh) =>{
        scene.remove(mesh.three);
        world.remove(mesh.cannon)
    })
}

//main
main = () =>{
    //global
    init();
    
    //on window resize
    window.addEventListener( 'resize', function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        renderer.setSize( width, height );
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
    
    GameLoop();
}

main();