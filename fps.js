const {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneBufferGeometry,
  BoxGeometry,
  VertexColors,
  Raycaster,
  Mesh,
  Color,
  Vector3,
  Fog,
  MeshBasicMaterial,
  HemisphereLight,
  Float32BufferAttribute
} = require("three");
const PointerLockControls = require("./fps-controls");

var camera, scene, renderer, controls;
var objects = [];
var raycaster;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new Vector3();
var direction = new Vector3();
var vertex = new Vector3();
var color = new Color();
init();
animate();

function init() {
  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  scene = new Scene();
  scene.background = new Color(0xffffff);
  scene.fog = new Fog(0xffffff, 0, 750);
  var light = new HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new PointerLockControls(camera);

  var blocker = document.getElementById("blocker");
  var instructions = document.getElementById("instructions");
  instructions.addEventListener(
    "click",
    function() {
      controls.lock();
    },
    false
  );
  controls.addEventListener("lock", function() {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });
  controls.addEventListener("unlock", function() {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  raycaster = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 10);
  var floorGeometry = new PlaneBufferGeometry(2000, 2000, 100, 100);
  floorGeometry.rotateX(-Math.PI / 2);
  // vertex displacement
  var position = floorGeometry.attributes.position;
  for (var i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i);
    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
  position = floorGeometry.attributes.position;
  var colors = [];
  for (var i = 0, l = position.count; i < l; i++) {
    color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    colors.push(color.r, color.g, color.b);
  }
  floorGeometry.addAttribute("color", new Float32BufferAttribute(colors, 3));
  var floorMaterial = new MeshBasicMaterial({
    vertexColors: VertexColors
  });
  var floor = new Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls.isLocked === true) {
    //raycaster.ray.origin.copy(controls.getObject().position);
    //raycaster.ray.origin.y -= 10;
    var intersections = raycaster.intersectObjects(objects);
    var onObject = intersections.length > 0;
    var time = performance.now();
    var delta = (time - prevTime) / 1000;
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveLeft) - Number(moveRight);
    direction.normalize(); // this ensures consistent movements in all directions
    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }
    controls.getObject().translateX(velocity.x * delta);
    controls.getObject().translateY(velocity.y * delta);
    controls.getObject().translateZ(velocity.z * delta);
    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;
      canJump = true;
    }
    prevTime = time;
  }
  renderer.render(scene, camera);
}
