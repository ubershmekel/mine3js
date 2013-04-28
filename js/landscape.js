
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

    return ( g.hdata[ x + z * worldWidth ] * 0.2 ) | 0;

}

function generateLandscape() {
    g.hdata = generateHeight( worldWidth, worldDepth );

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

            g.world[[x, h, z]] = {blockType: blockType.grass};
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

