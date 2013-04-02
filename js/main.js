
if ( ! Detector.webgl ) {

    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";

}

var fogExp2 = true;

var container, stats;

var camera, controls, scene, renderer;
var previewCube;
var mesh;
var mat = {};

//
// g force = jump_speed * 0.5 / max_jump_height
var gravity = 0.3;
var skyColor = 0xddddff;

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

var hdata = generateHeight( worldWidth, worldDepth );
var clock = new THREE.Clock();

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
       
        if (world[point] !== undefined) {
            return [prevPoint, point];
        }
        
        if (point != prevPoint) {
            prevPoint = point;
        }
    }
    
    return [undefined, undefined];
}

function onLeftClick() {
    // TODO: convert to mousedown and mouseup
    var target = getPointyTarget()[0];
    if(target !== undefined) {
        makeCube(blockType.dirt, target);
    }
}

function onRightClick() {
    // TODO: convert to mousedown and mouseup
    var target = getPointyTarget()[1];
    if(target !== undefined) {
        destroyCube(target);
    }
}

function init() {

    container = document.getElementById( 'container' );

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( skyColor, 0.015 );
    initMaterials();
    world = {};

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.0001, 200 );
    
    
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
        controls = new THREE.FirstPersonControls( camera );
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

    initPreviewCube();
    generateLandscape();


    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
    directionalLight.position.set( 1, 1, 0.5 ).normalize();
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer( { clearColor: skyColor, clearAlpha: 1 } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.innerHTML = "";

    container.appendChild( renderer.domElement );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

    //

    window.addEventListener( 'resize', onWindowResize, false );

    // some sun/moon to reach for, and mark the axis
    makeCube(blockType.red,   [0,   20, 0]);
    makeCube(blockType.green, [100, 20, 0]);
    makeCube(blockType.blue,  [0,   20, 100]);
}

function destroyCube(point) {
    if (world[point] === undefined) {
        console.log("Tried to destroy in empty block");
        return;
    }
    if (world[point].blockType == blockType.grass) {
        console.log("Destroying grass not yet implemented");
        return;
    }
    
    var obj = world[point];
    scene.remove(obj);
    //obj.dispose();
    //obj.deallocate(); 
    //obj.geometry.deallocate();
    //obj.material.deallocate();
    //obj.material.map.deallocate();
    //renderer.deallocateObject( obj );
    //renderer.deallocateTexture( texture );
    //renderer.deallocateMaterial( material );  
    delete world[point];
}

function makeCube(type, point) {
    if (world[point] !== undefined) {
        console.log("Tried to create in occupied block");
        return;
    }
    world[point] = NaN; // temp val for collision test
    if(isCollided()) {
        console.log("Tried to create block inside body");
        delete world[point];
        return;
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
    world[point] = mesh;
    
    scene.add(mesh);
}

function initMaterials() {
    var textureGrass = THREE.ImageUtils.loadTexture( 'img/grass.png' );
    textureGrass.magFilter = THREE.NearestFilter;
    textureGrass.minFilter = THREE.LinearMipMapLinearFilter;

    var textureDirt = THREE.ImageUtils.loadTexture( 'img/dirt.png' );
    textureGrass.magFilter = THREE.NearestFilter;
    textureGrass.minFilter = THREE.LinearMipMapLinearFilter;

    var textureGrassDirt = THREE.ImageUtils.loadTexture( 'img/grass_dirt.png' );
    textureGrassDirt.magFilter = THREE.NearestFilter;
    textureGrassDirt.minFilter = THREE.LinearMipMapLinearFilter;

    mat.grass = new THREE.MeshLambertMaterial( { map: textureGrass, ambient: 0xbbbbbb, vertexColors: THREE.VertexColors } );
    mat.dirt = new THREE.MeshLambertMaterial( { map: textureDirt, ambient: 0xbbbbbb, vertexColors: THREE.VertexColors } );
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

function generateLandscape() {
    var geometry = new THREE.Geometry();
    var dummy = new THREE.Mesh();
    // sides

    var light = new THREE.Color( 0xffffff );
    var shadow = new THREE.Color( 0x505050 );

    var matrix = new THREE.Matrix4();

    var pxGeometry = new THREE.PlaneGeometry( 1, 1 );
    pxGeometry.faces[ 0 ].materialIndex = 1;
    pxGeometry.faces[ 0 ].vertexColors = [ light, shadow, shadow, light ];
    pxGeometry.applyMatrix( matrix.makeRotationY( Math.PI / 2 ) );
    pxGeometry.applyMatrix( matrix.makeTranslation( 0.5, 0, 0 ) );

    var nxGeometry = new THREE.PlaneGeometry( 1, 1 );
    nxGeometry.faces[ 0 ].materialIndex = 1;
    nxGeometry.faces[ 0 ].vertexColors = [ light, shadow, shadow, light ];
    nxGeometry.applyMatrix( matrix.makeRotationY( - Math.PI / 2 ) );
    nxGeometry.applyMatrix( matrix.makeTranslation( - 0.5, 0, 0 ) );

    var pyGeometry = new THREE.PlaneGeometry( 1, 1 );
    pyGeometry.faces[ 0 ].materialIndex = 0;
    pyGeometry.faces[ 0 ].vertexColors = [ light, light, light, light ];
    pyGeometry.applyMatrix( matrix.makeRotationX( - Math.PI / 2 ) );
    pyGeometry.applyMatrix( matrix.makeTranslation( 0, 0.5, 0 ) );

    var pzGeometry = new THREE.PlaneGeometry( 1, 1 );
    pzGeometry.faces[ 0 ].materialIndex = 1;
    pzGeometry.faces[ 0 ].vertexColors = [ light, shadow, shadow, light ];
    pzGeometry.applyMatrix( matrix.makeTranslation( 0, 0, 0.5 ) );

    var nzGeometry = new THREE.PlaneGeometry( 1, 1 );
    nzGeometry.faces[ 0 ].materialIndex = 1;
    nzGeometry.faces[ 0 ].vertexColors = [ light, shadow, shadow, light ];
    nzGeometry.applyMatrix( matrix.makeRotationY( Math.PI ) );
    nzGeometry.applyMatrix( matrix.makeTranslation( 0, 0, -0.5 ) );
    for ( var z = 0; z < worldDepth; z ++ ) {

        for ( var x = 0; x < worldWidth; x ++ ) {
            var h = landscapeY( x, z );
            //console.log(x, z, h);

            world[[x, h, z]] = {blockType: blockType.grass};
            dummy.position.x = x;
            dummy.position.y = h;
            dummy.position.z = z;

            var px = landscapeY( x + 1, z );
            var nx = landscapeY( x - 1, z );
            var pz = landscapeY( x, z + 1 );
            var nz = landscapeY( x, z - 1 );

            var pxpz = landscapeY( x + 1, z + 1 );
            var nxpz = landscapeY( x - 1, z + 1 );
            var pxnz = landscapeY( x + 1, z - 1 );
            var nxnz = landscapeY( x - 1, z - 1 );

            dummy.geometry = pyGeometry;

            var colors = dummy.geometry.faces[ 0 ].vertexColors;
            colors[ 0 ] = nx > h || nz > h || nxnz > h ? shadow : light;
            colors[ 1 ] = nx > h || pz > h || nxpz > h ? shadow : light;
            colors[ 2 ] = px > h || pz > h || pxpz > h ? shadow : light;
            colors[ 3 ] = px > h || nz > h || pxnz > h ? shadow : light;

            THREE.GeometryUtils.merge( geometry, dummy );

            if ( ( px != h && px != h + 1 ) || x == 0 ) {

                dummy.geometry = pxGeometry;

                var colors = dummy.geometry.faces[ 0 ].vertexColors;
                colors[ 0 ] = pxpz > px && x > 0 ? shadow : light;
                colors[ 3 ] = pxnz > px && x > 0 ? shadow : light;

                THREE.GeometryUtils.merge( geometry, dummy );

            }

            if ( ( nx != h && nx != h + 1 ) || x == worldWidth - 1 ) {

                dummy.geometry = nxGeometry;

                var colors = dummy.geometry.faces[ 0 ].vertexColors;
                colors[ 0 ] = nxnz > nx && x < worldWidth - 1 ? shadow : light;
                colors[ 3 ] = nxpz > nx && x < worldWidth - 1 ? shadow : light;

                THREE.GeometryUtils.merge( geometry, dummy );

            }

            if ( ( pz != h && pz != h + 1 ) || z == worldDepth - 1 ) {

                dummy.geometry = pzGeometry;

                var colors = dummy.geometry.faces[ 0 ].vertexColors;
                colors[ 0 ] = nxpz > pz && z < worldDepth - 1 ? shadow : light;
                colors[ 3 ] = pxpz > pz && z < worldDepth - 1 ? shadow : light;

                THREE.GeometryUtils.merge( geometry, dummy );

            }

            if ( ( nz != h && nz != h + 1 ) || z == 0 ) {

                dummy.geometry = nzGeometry;

                var colors = dummy.geometry.faces[ 0 ].vertexColors;
                colors[ 0 ] = pxnz > nz && z > 0 ? shadow : light;
                colors[ 3 ] = nxnz > nz && z > 0 ? shadow : light;

                THREE.GeometryUtils.merge( geometry, dummy );

            }

        }

    }

    var mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( [ mat.grass, mat.grassDirt ] ) );
    scene.add( mesh );
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

function generateHeight( width, height ) {

    var data = [], perlin = new ImprovedNoise(),
    size = width * height, quality = 2, z = Math.random() * 1;

    for ( var j = 0; j < 4; j ++ ) {

        if ( j == 0 ) for ( var i = 0; i < size; i ++ ) data[ i ] = 0;

        for ( var i = 0; i < size; i ++ ) {

            var x = i % width, y = ( i / width ) | 0;
            data[ i ] += perlin.noise( x / quality, y / quality, z ) * quality;

        }

        quality *= 4

    }

    return data;

}

function landscapeY( x, z ) {

    return ( hdata[ x + z * worldWidth ] * 0.2 ) | 0;

}

function isCollided() {
    var pos = camera.position;
    
    // You're standing above the cube that's Math.floor and you're
    // close to the cube that's Math.round near you.
    var ix = Math.round(pos.x);
    var iz = Math.round(pos.z);
    
    var iy = Math.floor(pos.y);
    
    if(world[[ix, iy, iz]] !== undefined) {
        return true;
    }
    
    if(world[[ix, iy - 1, iz]] !== undefined) {
        return true;
    }
    
    return false;
}


function physics(dt) {
    var pos = camera.position;
    camera.vy = camera.vy - gravity * dt
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

