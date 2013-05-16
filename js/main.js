

if ( ! Detector.webgl ) {

    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";

}


g.world = {};
g.cubeLog = {};

var fogExp2 = true;

var container, stats;

var camera, controls, scene, renderer;
var previewCube;
var mesh;
var mat = {};

// This equation should be correct, but I don't know why it isn't.
// g force = -jump_speed * 0.5 / max_jump_height
g.gravity = -0.3;
g.jumpVY = 0.13;
g.skyColor = 0xddddff;

g.cameraFOV = 75;
g.cameraNear = 0.001;
g.cameraFar = 200;

// in blocks
var worldWidth = 200, worldDepth = 200;
var worldHalfWidth = worldWidth / 2;
var worldHalfDepth = worldDepth / 2;

var blockType = {
    grass: 'g',
    dirt: 'd',
    red:   0xff0000,
    green: 0x00ff00,
    blue:  0x0000ff,
    white: 0xffffff,
    black: 0x000000,
}

var clock = new THREE.Clock();
var SECOND_MS = 1000;
g.lastClick = -1;

var maxPlacementRange = 10;
var collideVectorStepSize = 0.2;

function getPointyTarget() {
    // Tracks down the target for destroying cubes
    // and the previous point for constructing cubes.
    var dir = camera.direction();
    dir.multiplyScalar(collideVectorStepSize);
    var dist = 0;
    var vec = camera.position.clone();
    var prevPoint = undefined;

    while(dist < maxPlacementRange) {
        dist += collideVectorStepSize;
        vec.add(dir);
        var point = [Math.round(vec.x), Math.round(vec.y), Math.round(vec.z)];

        if (g.world[point] !== undefined) {
            return [prevPoint, point];
        }

        if (point != prevPoint) {
            prevPoint = point;
        }
    }

    return [undefined, undefined];
}

function onLeftClick() {
    var target = getPointyTarget()[0];
    if(target !== undefined) {
        if(makeCube(blockType.dirt, target)) {
            g.cubeLog[target] = target;
            g.updateUrl();
        }
    }
}

function onRightClick() {
    var target = getPointyTarget()[1];
    if(target !== undefined) {
        if(destroyCube(target)) {
            delete g.cubeLog[target];
            g.updateUrl();
        }
    }
}

function init() {

    container = document.getElementById( 'container' );

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( g.skyColor, 0.015 );
    initMaterials();
    initPreviewCube();
    generateLandscape();

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera( g.cameraFOV, aspect, g.cameraNear, g.cameraFar );


    camera.vx = 0;
    camera.vy = 0;
    camera.vz = 0;
    camera.isOnGround = true;
    camera.direction = function() {
        // Figure out the camera viewing direction
        var lookingAt = new THREE.Vector3( 0, 0, -1 );
        lookingAt = lookingAt.applyEuler( camera.rotation, camera.eulerOrder );
        return lookingAt;
    }

    var hasPointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;;
    if (hasPointerLock) {
        controls = new THREE.PointerLockControls( camera );
        controls.register();
        //scene.add( controls.getObject() );
    } else {
        alert("Mine3js requires pointer lock and your browser doesn't seem to have it :/");
    }

    camera.position.y = landscapeY( worldHalfWidth, worldHalfDepth ) + 2;
    camera.position.x = worldHalfWidth;
    camera.position.z = worldHalfDepth;

    controls.onLeftClick = onLeftClick;
    controls.onRightClick = onRightClick;

    controls.movementSpeed = 8;
    controls.lookSpeed = 0.125;
    controls.lookVertical = true;
    controls.constrainVertical = true;
    //controls.verticalMin = 1.1;
    //controls.verticalMax = 2.2;

    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
    directionalLight.position.set( 1, 1, 0.5 ).normalize();
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer( { clearColor: g.skyColor, clearAlpha: 1 } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.innerHTML = "";

    container.appendChild( renderer.domElement );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );

    g.restoreFromUrl();

    // some sun/moon to reach for, and mark the axis
    makeCube(blockType.red,   [0,   20, 0]);
    makeCube(blockType.green, [100, 20, 0]);
    makeCube(blockType.blue,  [0,   20, 100]);
}

function destroyCube(point) {
    if (g.world[point] === undefined) {
        console.log("Tried to destroy in empty block");
        return false;
    }
    if (g.world[point].blockType == blockType.grass) {
        console.log("Destroying grass not yet implemented");
        return false;
    }

    var obj = g.world[point];
    scene.remove(obj);
    //obj.dispose();
    //obj.deallocate();
    //obj.geometry.deallocate();
    //obj.material.deallocate();
    //obj.material.map.deallocate();
    //renderer.deallocateObject( obj );
    //renderer.deallocateTexture( texture );
    //renderer.deallocateMaterial( material );

    delete g.world[point];
    
    return true;
}

function makeCube(type, point) {
    if (g.world[point] !== undefined) {
        console.log("Tried to create in occupied block");
        return false;
    }
    g.world[point] = NaN; // temp val for collision test
    if(isCollided()) {
        console.log("Tried to create block inside body");
        delete g.world[point];
        return false;
    }

    var geometry = new THREE.CubeGeometry(1,1,1);
    var color = 0x000000;
    if (typeof type == "number") {
        color = type;
    }

    var material;
    if (type == blockType.dirt) {
        material = mat.dirt;
    } else {
        material = new THREE.MeshLambertMaterial({
        color : color,
        overdraw : true,
        fog: false,
        shading : THREE.FlatShading});

    }
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = point[0];
    mesh.position.y = point[1];
    mesh.position.z = point[2];

    // for physics
    mesh.blockType = type;
    g.world[point] = mesh;

    scene.add(mesh);
    return true;
}

g.numToCode = function(number) {
    var text = Base64.fromNumber(number);
    if (text.length < 2) {
        return "0" + text;
    } else {
        return text;
    }
}
/*
Tested with the standard random data

Math.min.apply(null, xs)
0
Math.min.apply(null, zs)
0
Math.max.apply(null, xs)
199
Math.max.apply(null, zs)
199

Math.min.apply(null, ys)
-13
Math.max.apply(null, ys)
20
*/
g.worldFloor = -13;
g.urlMarker = "#a=";
g.updateUrl = function() {
    var urlCubes = "";
    for (var pointText in g.cubeLog) {
        var point = g.cubeLog[pointText];
        //urlCubes += point + ",";
        //console.log(point)
        // +13 to avoid negative numbers in the Y axis
        urlCubes += Base64.fromPoint([point[0], point[1] - g.worldFloor, point[2]])
    }

    // "a=" is to allow future enhancements
    history.replaceState({}, "title", g.urlMarker + urlCubes);
}

g.restoreFromUrl = function() {
    var url = window.location.href + "";
    
    var hashLoc = url.indexOf(g.urlMarker);
    if(hashLoc == -1) {
        return;
    }
    var data = url.slice(hashLoc + g.urlMarker.length);
    console.log('url data ' + data.length);
    console.log('data:' + data);
    
    var coords = [];
    for (var i = 0; i < data.length; i += 4) {
        coords.push(Base64.toPoint(data.slice(i, i + 4)));
    }

    //console.log(coords);
    for (var i = 0; i < coords.length; i ++) {
        // +13 was to avoid negative numbers in the Y axis
        var t = coords[i];
        var target = [t[0], t[1] + g.worldFloor, t[2]];
        g.cubeLog[target] = target;
        makeCube(blockType.dirt, target);
    }
}

function initMaterials() {
    var textureGrass = THREE.ImageUtils.loadTexture( 'img/grass.png' );
    textureGrass.magFilter = THREE.NearestFilter;
    textureGrass.minFilter = THREE.LinearMipMapLinearFilter;

    var textureDirt = THREE.ImageUtils.loadTexture( 'img/dirt.png' );
    textureDirt.magFilter = THREE.NearestFilter;
    textureDirt.minFilter = THREE.LinearMipMapLinearFilter;

    var textureGrassDirt = THREE.ImageUtils.loadTexture( 'img/grass_dirt.png' );
    textureGrassDirt.magFilter = THREE.NearestFilter;
    textureGrassDirt.minFilter = THREE.LinearMipMapLinearFilter;

    mat.grass = new THREE.MeshLambertMaterial( { map: textureGrass, ambient: 0xbbbbbb, vertexColors: THREE.VertexColors } );
    mat.dirt = new THREE.MeshLambertMaterial( { map: textureDirt, ambient: 0xbbbbbb, vertexColors: THREE.VertexColors, shading: THREE.FlatShading } );
    mat.grassDirt = new THREE.MeshLambertMaterial( { map: textureGrassDirt, ambient: 0xbbbbbb, vertexColors: THREE.VertexColors } );
    mat.wire = new THREE.MeshBasicMaterial( { color: 0x111166, wireframe: true, transparent: false } );
}

function initPreviewCube() {
    var geometry = new THREE.CubeGeometry(1,1,1);
    var material = mat.wire;

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = -1;
    mesh.position.y = -1;
    mesh.position.z = -1;

    previewCube = mesh;
    scene.add(mesh);
}

function updatePreviewCube() {
    var targets = getPointyTarget();
    var first = targets[0];
    if (first === undefined) {
        previewCube.visible = false;
        return;
    }
    previewCube.position.x = first[0];
    previewCube.position.y = first[1];
    previewCube.position.z = first[2];
    previewCube.visible = true;
    //console.log(first);
}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    controls.handleResize();

}

function loadTexture( path, callback ) {

    var image = new Image();

    image.onload = function () { callback(); };
    image.src = path;

    return image;

}


function isCollided() {
    var pos = camera.position;

    // You're standing above the cube that's Math.floor and you're
    // close to the cube that's Math.round near you.
    var ix = Math.round(pos.x);
    var iz = Math.round(pos.z);

    var iy = Math.floor(pos.y);

    if(g.world[[ix, iy, iz]] !== undefined) {
        return true;
    }

    if(g.world[[ix, iy - 1, iz]] !== undefined) {
        return true;
    }

    return false;
}


function physics(dt) {
    /*
     dt - delta time from last frame in seconds.
    */
    if (!controls.enabled) {
        return;
    }
    var pos = camera.position;
    camera.vy = camera.vy + g.gravity * dt
    camera.vy = Math.max(camera.vy, -5); // terminal velocity

    pos.y += camera.vy;
    if (isCollided()) {
        pos.y -= camera.vy;
        camera.vy = 0; // to avoid exploding gravity
        camera.isOnGround = true;
    }

    var lookingAt = camera.direction();
    var ddx = -lookingAt.z * camera.vx - lookingAt.x * camera.vz;
    var ddz = lookingAt.x * camera.vx - lookingAt.z * camera.vz;
    pos.x += ddx;
    if (isCollided()) {
        pos.x -= ddx;
    }
    pos.z += ddz;
    if (isCollided()) {
        pos.z -= ddz;
    }

    // TODO: refactor this tangle
    if (controls.mouseDragOn) {
        if (Date.now() - g.lastClick > 0.3 * SECOND_MS) {
            g.lastClick = Date.now();
            controls.doClick();
        }
    }
}

function animate() {

    requestAnimationFrame( animate );

    // minimum of 5 "fps" steps - important for collision detection
    var dt = Math.min(0.2, clock.getDelta());
    render(dt);

    stats.update();
}

function render(dt) {

    controls.update( dt );
    physics(dt);
    updatePreviewCube();
    renderer.render( scene, camera );

}

init();
animate();

