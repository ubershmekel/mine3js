
if ( ! Detector.webgl ) {

    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";

}

var fogExp2 = true;

var container, stats;

var camera, controls, scene, renderer;

var mesh, mat;

// in blocks
var worldWidth = 200, worldDepth = 200;
var worldHalfWidth = worldWidth / 2;
var worldHalfDepth = worldDepth / 2;
var hdata = generateHeight( worldWidth, worldDepth );

var blockType = {
    grass: 's',
    earth: 'e',
    red:   0xff0000,
    green: 0x00ff00,
    blue:  0x0000ff,
    white: 0xffffff,
    black: 0x000000,
}

var clock = new THREE.Clock();

function onLeftClick() {
    console.log('left');
}

function onRightClick() {
    console.log('right');
}

function init() {

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 200 );
    camera.position.y = getY( worldHalfWidth, worldHalfDepth ) + 2;
    camera.position.x = worldHalfWidth;
    camera.position.z = worldHalfDepth;
    
    camera.vx = 0;
    camera.vy = 0;
    camera.vz = 0;
    camera.onGround = true;


    controls = new THREE.FirstPersonControls( camera );
    controls.onLeftClick = onLeftClick;
    controls.onRightClick = onRightClick;
    
    controls.movementSpeed = 8;
    controls.lookSpeed = 0.125;
    controls.lookVertical = true;
    controls.constrainVertical = true;
    controls.verticalMin = 1.1;
    controls.verticalMax = 2.2;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xffffff, 0.00015 );



    //
    world = {};
    generateLandscape();


    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
    directionalLight.position.set( 1, 1, 0.5 ).normalize();
    scene.add( directionalLight );

    renderer = new THREE.WebGLRenderer( { clearColor: 0xddddff, clearAlpha: 1 } );
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
    makeCube(blockType.red,   0,   20, 0);
    makeCube(blockType.green, 100, 20, 0);
    makeCube(blockType.blue,  0,   20, 100);
}

function makeCube(type, x, y, z) {
    var geometry = new THREE.CubeGeometry(1,1,1);
    var color = 0x000000;
    if (typeof type == "number") {
        color = type;
    }
    
    var ballMaterial = new THREE.MeshLambertMaterial({
        color : color,
        overdraw : true,
        fog: false,
        shading : THREE.FlatShading});
    var mesh = new THREE.Mesh(geometry, ballMaterial);
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    
    // for physics
    mesh.blockType = type;
    world[[x, y, z]] = mesh;
    
    scene.add(mesh);
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
            var h = getY( x, z );
            //console.log(x, z, h);

            world[[x, h, z]] = blockType.grass;
            dummy.position.x = x;
            dummy.position.y = h;
            dummy.position.z = z;

            var px = getY( x + 1, z );
            var nx = getY( x - 1, z );
            var pz = getY( x, z + 1 );
            var nz = getY( x, z - 1 );

            var pxpz = getY( x + 1, z + 1 );
            var nxpz = getY( x - 1, z + 1 );
            var pxnz = getY( x + 1, z - 1 );
            var nxnz = getY( x - 1, z - 1 );

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

    var textureGrass = THREE.ImageUtils.loadTexture( 'img/grass.png' );
    textureGrass.magFilter = THREE.NearestFilter;
    textureGrass.minFilter = THREE.LinearMipMapLinearFilter;

    var textureGrassDirt = THREE.ImageUtils.loadTexture( 'img/grass_dirt.png' );
    textureGrassDirt.magFilter = THREE.NearestFilter;
    textureGrassDirt.minFilter = THREE.LinearMipMapLinearFilter;

    var material1 = new THREE.MeshLambertMaterial( { map: textureGrass, ambient: 0xbbbbbb, vertexColors: THREE.VertexColors } );
    var material2 = new THREE.MeshLambertMaterial( { map: textureGrassDirt, ambient: 0xbbbbbb, vertexColors: THREE.VertexColors } );

    var mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( [ material1, material2 ] ) );
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

function getY( x, z ) {

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

//
var pad = 0.25;
var directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
var playerHeight = 2;
// g force = jump_speed * 0.5 / max_jump_height
var gravity = 0.3;
function physics(dt) {
    var pos = camera.position;
    camera.vy = camera.vy - gravity * dt
    camera.vy = Math.max(camera.vy, -5); // terminal velocity

    pos.y += camera.vy;
    if (isCollided()) {
        pos.y -= camera.vy;
        camera.vy = 0; // to avoid exploding gravity
        camera.onGround = true;
    }
    
    // Figure out the camera viewing direction
    var lookingAt = new THREE.Vector3( 0, 0, -1 );
    lookingAt = lookingAt.applyEuler( camera.rotation, camera.eulerOrder );

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
    physics(dt);

    stats.update();
}

function render(dt) {

    controls.update( dt );
    renderer.render( scene, camera );

}

init();
animate();

