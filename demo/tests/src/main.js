import {
  HemisphereLight,
  DirectionalLight,
  BoxBufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from '../../../node_modules/three/build/three.module.js';

import { OrbitControls } from '../../../node_modules/three/examples/jsm/controls/OrbitControls.js';

import { testCSG } from './csg-test.js';

function init() {
  const container = document.querySelector('#scene-container');

  const camera = new PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.set(-1, 2, 5);

  const scene = new Scene();
  scene.background = new Color('skyblue');

  const ambient = new HemisphereLight(0xffffff, 0x424242, 0.4);
  const direct = new DirectionalLight(0xffffff, 0.6);

  scene.add(ambient, direct);

  // scene.overrideMaterial = new MeshBasicMaterial({
  //   color: 'grey',
  //   side: DoubleSide,
  //   wireframe: true,
  // });

  const results = testCSG();


  scene.add(
    results.testMesh,
  );
  console.log('results.testMesh: ', results.testMesh);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
  });
}

init();
