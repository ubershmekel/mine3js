/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera ) {

	var scope = this;

  camera.target = new THREE.Vector3( 0, 0, 0 );
  scope.lookVertical = true;
  scope.lon = -90; // initial camera direction
  scope.lat = 0;
  scope.dxSpeed = 0.1;
  scope.dySpeed = 0.3;
  scope.verticalMin = 0;
  scope.verticalMax = Math.PI;
  
  scope.movementSpeed = 1.0;
  scope.blocker = document.getElementById( 'blocker' );
  scope.instructions = document.getElementById( 'instructions' );
        
  
    
	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var moveUp = false;
	var moveDown = false;

	var isOnObject = false;
	var canJump = false;

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		//yawObject.rotation.y -= movementX * 0.002;
		//pitchObject.rotation.x -= movementY * 0.002;
        mouseDelta(movementX, movementY);

		//pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};
    
    var mouseDelta = function(dx, dy) {
        scope.lon += dx * scope.dxSpeed;
        if( scope.lookVertical ) scope.lat -= dy * scope.dySpeed;

        scope.lat = Math.max( - 85, Math.min( 85, scope.lat ) );
        scope.phi = THREE.Math.degToRad( 90 - scope.lat );

        scope.theta = THREE.Math.degToRad( scope.lon );

        if ( scope.constrainVertical ) {

            scope.phi = THREE.Math.mapLinear( scope.phi, 0, Math.PI, scope.verticalMin, scope.verticalMax );

        }

        position = camera.position;

        camera.target.x = position.x + 100 * Math.sin( scope.phi ) * Math.cos( scope.theta );
        camera.target.y = position.y + 100 * Math.cos( scope.phi );
        camera.target.z = position.z + 100 * Math.sin( scope.phi ) * Math.sin( scope.theta );

        camera.lookAt( camera.target );    
    }

	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

            case 32: /*space*/
            case 82: /*R*/ moveUp = true; break;
            case 70: /*F*/ moveDown = true; break;

		}

	};

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 71: // g
				window.open('https://github.com/ubershmekel/mine3js/');
				break;

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // a
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

            case 32: /*space*/
            case 82: /*R*/ moveUp = false; break;
            case 70: /*F*/ moveDown = false; break;
		}

	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	/*this.getObject = function () {

		return yawObject;

	};*/

	this.isOnObject = function ( boolean ) {

		isOnObject = boolean;
		canJump = boolean;

	};

	this.update = function ( delta ) {

		if ( scope.enabled === false ) return;

		/*velocity.x += ( - velocity.x ) * 0.08 * delta;
		velocity.z += ( - velocity.z ) * 0.08 * delta;

		velocity.y -= 0.25 * delta;*/

        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        
		if ( moveForward ) velocity.z -= scope.movementSpeed * delta;
		if ( moveBackward ) velocity.z += scope.movementSpeed * delta;

		if ( moveLeft ) velocity.x -= scope.movementSpeed * delta;
		if ( moveRight ) velocity.x += scope.movementSpeed * delta;

		if ( isOnObject === true ) {

			velocity.y = Math.max( 0, velocity.y );

		}

		camera.vx = velocity.x;
		//camera.vy = velocity.y; 
		camera.vz = velocity.z ;

        if ( this.fly ) {
            if ( moveUp ) camera.translateY( actualMoveSpeed );
            if ( moveDown ) camera.translateY( - actualMoveSpeed );
        } else {
            // g force = jump_speed * 0.5 / max_jump_height
            if ( moveUp  && camera.isOnGround) {
                camera.isOnGround = false;
                camera.vy = 0.13;
            }
        }
        
		/*if ( yawObject.position.y < 10 ) {

			velocity.y = 0;
			yawObject.position.y = 10;

			canJump = true;

		}*/

	};
	
	scope.onResume = function() {
    scope.enabled = true;
    scope.blocker.style.display = 'none';
	};
	
	scope.onPause = function() {
    scope.enabled = false;

    scope.blocker.style.display = '-webkit-box';
    scope.blocker.style.display = '-moz-box';
    scope.blocker.style.display = 'box';

    scope.instructions.style.display = '';
	}
	
	
	this.handleResize = function() {};
    
    this.register = function() {
        element = document.body;

        var pointerlockchange = function ( event ) {

            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

              scope.onResume();
                
            } else {
              scope.onPause();
            }

        }

        var pointerlockerror = function ( event ) {

            scope.instructions.style.display = '';

        }

        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

        scope.instructions.addEventListener( 'click', function ( event ) {

            scope.instructions.style.display = 'none';

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

            if ( /Firefox/i.test( navigator.userAgent ) ) {

                var fullscreenchange = function ( event ) {

                    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                        document.removeEventListener( 'fullscreenchange', fullscreenchange );
                        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                        element.requestPointerLock();
                    }

                }

                document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

                element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

                element.requestFullscreen();

            } else {

                element.requestPointerLock();

            }
            
            // needs to be here or these don't fire after requestPointerLock
            element.addEventListener( 'mousedown', onMouseDown, false );
            element.addEventListener( 'mouseup', onMouseUp, false );


        }, false );
    
    };
    
    // doClick is called by main.js with mouseDragOn.
    scope.doClick = function() {
    		if ( scope.enabled === false ) return;
    		
        switch ( scope.button ) {
            case 0: scope.onLeftClick(); break;
            case 2: scope.onRightClick(); break;
        }
    }
    
    var onMouseDown = function ( event ) {

        event.preventDefault();
        event.stopPropagation();

        switch ( event.button ) {

            //case 0: this.moveForward = true; break;
            //case 2: this.moveBackward = true; break;

        }

        scope.button = event.button;
        scope.mouseDragOn = true;

    };    
    var onMouseUp = function ( event ) {

        event.preventDefault();
        event.stopPropagation();


        switch ( event.button ) {

            //case 0: this.moveForward = false; break;
            //case 2: this.moveBackward = false; break;
            //case 0: scope.onLeftClick(); break;
            //case 2: scope.onRightClick(); break;

        }

        scope.mouseDragOn = false;

    };
};
