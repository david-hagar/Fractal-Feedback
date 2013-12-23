var Feedback = Class.create({
    initialize: function (opts) {
        this._config(opts);
        this._setup();
    },
    _config: function (opts) {
        this.opts = jQuery.extend(true, {
            showStats: false,
            resizeWithWindow: true,
            container: '',
            debugLogging:false

        }, opts);
    },
    _setup: function () {
        feedbackContext = this; // used as a global reference for getting config info
        this.hue = 0;
        this.mouse = new THREE.Vector3();
        this.lastMouse = new THREE.Vector3();
        this.animationEnabled = true;

        this._initLogging();
        this._initControls();

        // three.js setup
        this._three();

        this._initObjects();

        this.renderer.domElement.addEventListener('mousemove', function(event) {
            feedbackContext.mouseMove(event);
        }, false);
        this.renderer.domElement.addEventListener('click', function(event) {
            feedbackContext.mouseClick(event);
        }, false);

        this._animate();  // start main loop
    },
    _initLogging: function () {
        if (console.debug === undefined)
            console.debug = console.log;
    },
    _three: function () {
        this.container = jQuery(this.opts.container);
        if (!this.container.length) {
            throw "Missing or no container specified.";
        }

        this.container = this.container.get(0);

        this._setupCameraScene();
        this._setupRenderer();

        this._initResize();
    },
    _setupCameraScene: function () {
        this.camera =
            new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 10, 1000);
        this.camera.position.set(0, 0, 500);

        this.cameraFrustum = new THREE.Frustum();

        this.scene = new THREE.Scene();

        this.rootObject3D = new THREE.Object3D();


        this.scene.add(this.rootObject3D);
    },

    _setupRenderer: function () {

        if (!Detector.webgl) {
            alert("Your browser does not support WebGL. Try Chrome, FireFox, IE 11, or Safari.");
            throw "no webGL";
        }

        this.renderer = Detector.webgl ? new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer:true }) :
            new THREE.CanvasRenderer();

        this.container.appendChild(this.renderer.domElement);

        if (this.opts.showStats) {
            this.stats = new Stats();
            this.stats.domElement.style.position = 'absolute';
            this.stats.domElement.style.top = '0px';
            this.container.appendChild(this.stats.domElement);
        }
    },

    _initControls: function() {

        var mouseOptions = this.mouseOptions = [ 'Off', '+X', '-X', '+Y' , '-Y' ];
        this.mouseOptions.off = this.mouseOptions[0];
        this.mouseOptions.mouseX = this.mouseOptions[1];
        this.mouseOptions.mouseY = this.mouseOptions[3];
        this.mouseOptions.minusMouseX = this.mouseOptions[2];
        this.mouseOptions.minusMouseY = this.mouseOptions[4];


        this.controls = new function() {

            this.transforms = [];

            this.transforms.push(new Transform({
                rotate:mouseOptions.mouseX,
                scale:mouseOptions.mouseX
            }));

            this.transforms.push(new Transform({
                rotate:mouseOptions.mouseY,
                scale:mouseOptions.mouseY
            }));


        };


        var gui = new dat.GUI();
        gui.close();

        for (var i = 0; i < this.controls.transforms.length; i++) {
            var transform = this.controls.transforms[i];
            var folder = gui.addFolder('Transform ' + (i + 1));

            folder.add(transform, 'xOffset', this.mouseOptions);
            folder.add(transform, 'yOffset', this.mouseOptions);
            folder.add(transform, 'scale', this.mouseOptions);
            folder.add(transform, 'rotate', this.mouseOptions);
            folder.add(transform, 'aspect', this.mouseOptions);

            folder.open();

        }


    },

    _animate: function () {

        if (! this.animationEnabled)
            return;

        this._render();

        feedbackContext = this;
        //setTimeout(function () {
        //    feedbackContext._animate();
        //}, 1000);
        requestAnimationFrame(function () {
            feedbackContext._animate();
        });


    },

    _render: function () {                                   // *** render ***
        if (this.stats != undefined)
            this.stats.update();

        this.updateFrame();

        this.renderer.render(this.scene, this.camera);
    },

    _initResize: function () {
        var container = jQuery(this.container);
        this.updateSize(container.width(), container.height());

        if (!this.opts.resizeWithWindow) return;
        feedbackContext = this;
        jQuery(window).resize(function () {
            feedbackContext.updateSize(container.width(), container.height());
        });
    },



//  public methods designed to be called from anywhere including window scope

    updateSize: function (width, height) {
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;

        this.camera.fov = 50;
        if (height > width)
            this.camera.fov *= height / width;

        this.camera.updateProjectionMatrix();

        this.minWindowDimension = Math.min(width, height);

    },

    _initObjects: function() {

        this.screenCopyScale = 0.5;
        this.screenCopy = document.createElement('canvas');
        this.screenCopy.width = this.renderer.domElement.width * this.screenCopyScale;
        this.screenCopy.height = this.renderer.domElement.height * this.screenCopyScale;
        this.texture = new THREE.Texture(this.screenCopy);

        this.screenCopyContext = this.screenCopy.getContext('2d');

        var s = 375;
        var aspect =  this.renderer.domElement.height / this.renderer.domElement.width;
        var transformBoxGeom = new THREE.PlaneGeometry(s, s*aspect);

        this._addObject(-100, 0, 1.4, -Math.PI / 4, 1.25, 0.95, transformBoxGeom, this.controls.transforms[0]);
        this._addObject(100, 0, 1.3, -Math.PI / 4, 1.25, 0.95, transformBoxGeom, this.controls.transforms[1]);

        //todo: make root geom size adjustable
        //var geom = new THREE.PlaneGeometry(75, 75);
        var geom = new THREE.CircleGeometry(50, 32);


        var color = new THREE.Color().setHSL(this.hue, 0.9, 0.5);

        //todo: make opacity controllable
        this.objectMaterial = new THREE.MeshBasicMaterial({ color:color, side:THREE.DoubleSide,  opacity: 0.99, transparent:true});

        var mesh = new THREE.Mesh(geom, this.objectMaterial);
        //mesh.position = this.mouse.clone().multiplyScalar(300);
        mesh.position.z = 1.65;
        this.rootObject3D.add(mesh);


    },

    _addObject: function(x, y, z, rot, scale, opacity, geom, transform) {
        var textureMaterial = new THREE.MeshBasicMaterial({ map: this.texture, side:THREE.DoubleSide , opacity:opacity, transparent:true});

        var mesh = this.leftMesh = new THREE.Mesh(geom, textureMaterial);
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
        mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;

        mesh.rotation.z = rot;
        this.rootObject3D.add(mesh);

        transform.textureMaterial = textureMaterial;
        transform.mesh = mesh;
    },

    updateFrame: function() {

        //var hueMouseOffset =  (this.getOffset( this.mouseOptions.mouseX ) +    this.getOffset( this.mouseOptions.mouseY ))*0;
        var hueSaturation    = (this.hue >0.9 && this.hue<1.0) ? 1.0:0.5;
        var hueBrightness    = (this.hue >0.9 && this.hue<1.0) ? 0.9:0.4;
        this.hue = (this.hue + 0.005 ) % 1;
        this.objectMaterial.color = new THREE.Color().setHSL(this.hue, hueSaturation, hueBrightness);    //todo: make this a control

        this.screenCopyContext.setTransform(1, 0, 0, 1, 0, 0);
        this.screenCopyContext.clearRect(0, 0, this.renderer.domElement.width, this.renderer.domElement.height);

        this.screenCopyContext.scale(this.screenCopyScale, this.screenCopyScale);

        this.screenCopyContext.drawImage(this.renderer.domElement, 0, 0);
        this.texture.needsUpdate = true;

        var transforms = this.controls.transforms;
        for (var i = 0; i < transforms.length; i++) {
            this.updateTransform(transforms[i]);
        }

        this.lastMouse = this.mouse;
    },

    updateTransform: function(transform) {
        var mesh = transform.mesh;

        var translateScale =250;
        mesh.position.x += this.getOffset(transform.xOffset) * translateScale;
        mesh.position.y += this.getOffset(transform.yOffset) * translateScale;
        mesh.rotation.z += this.getOffset(transform.rotate) * Math.PI * 2;

        var scaleDelta = this.getOffset(transform.scale)*0.5;
        mesh.scale.x +=scaleDelta;
        mesh.scale.y +=scaleDelta;

        var aspect = this.getOffset(transform.aspect)
        mesh.scale.x +=aspect ;
        mesh.scale.y -=aspect ;


    },

    getOffset: function(mouseMode) {
        if (mouseMode == this.mouseOptions.off)
            return 0;

        if (mouseMode == this.mouseOptions.mouseX)
            return this.mouse.x - this.lastMouse.x;

        if (mouseMode == this.mouseOptions.mouseY)
            return this.mouse.y - this.lastMouse.y;

        if (mouseMode == this.mouseOptions.minusMouseX)
            return -(this.mouse.x - this.lastMouse.x);

        if (mouseMode == this.mouseOptions.minusMouseY)
            return -(this.mouse.y - this.lastMouse.y);
        else
            throw "unknown mouse mode " + mouseMode;

    },

    mouseMove: function(event) {
        this.mouse = this.getNormalizedMouse(event);
    },

    mouseClick: function(event) {
        this.animationEnabled = ! this.animationEnabled;

        if (this.animationEnabled)
            this._animate();
    },

    getNormalizedMouse:function getNormalizedMouse(event, logType) {
        event.preventDefault();
        var container = jQuery(this.container);
        var x = event.pageX - container.offset().left;
        var y = event.pageY - container.offset().top;
        //console.log("here") ;
        var xNormalized = ( x / container.width()) * 2 - 1;
        var yNormalized = - ( y / container.height() ) * 2 + 1;
        return new THREE.Vector3(xNormalized, yNormalized, 0);
    },

    generateCircleGeom:function(radius, segments){
        var circle = new THREE.Shape();

        for (var i = 0; i < segments; i++) {
          var pct = (i + 1) / segments;
          var theta = pct * Math.PI * 2.0;
          var x = radius * Math.cos(theta);
          var y = radius * Math.sin(theta);
          if (i == 0) {
            circle.moveTo(x, y);
          } else {
            circle.lineTo(x, y);
          }
        }

        var geometry = circle.makeGeometry();
    }

});


var Transform = Class.create({
    initialize: function (opts) {
        this._config(opts);

    },
    _config: function (opts) {
        this.opts = jQuery.extend(true, {
            xOffset: "Off",
            yOffset:"Off",
            scale: "Off",
            rotate:"Off",
            aspect:"Off"
        }, opts);

        this.xOffset = this.opts.xOffset;
        this.yOffset = this.opts.yOffset;
        this.scale = this.opts.scale;
        this.rotate = this.opts.rotate;
        this.aspect = this.opts.aspect;
    }
});