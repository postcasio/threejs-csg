import {
  BoxBufferGeometry,
  CylinderBufferGeometry,
  BufferAttribute,
  BufferGeometry,
  PlaneBufferGeometry,
  SphereBufferGeometry,
  MeshStandardMaterial,
  Mesh,
  TextureLoader,
} from '../../../node_modules/three/build/three.module.js';

import { CSG } from '../../../build/csg.module.js';

function testCSG(params) {
  const loader = new TextureLoader();
  const textureBW = loader.load(
    '/demo/assets/textures/uv-test-bw.png',
  );
  const textureCol = loader.load(
    '/demo/assets/textures/uv-test-col.png',
  );

  const red = new MeshStandardMaterial({ color: 'orangered' });
  const green = new MeshStandardMaterial({ color: 'seagreen' });
  const blue = new MeshStandardMaterial({ color: 'lightblue' });
  const uvBW = new MeshStandardMaterial({
    map: textureBW,
    // wireframe: true,
  });
  const uvCol = new MeshStandardMaterial({ map: textureCol });

  const box = new Mesh(new BoxBufferGeometry(0.2, 0.2, 1), uvBW);
  // console.log('box: ', new BoxBufferGeometry(0.2, 0.2, 1));
  box.position.set(0.1, 0.1, 0);

  const sphere = new Mesh(new SphereBufferGeometry(0.1, 12, 12), red);
  sphere.position.set(0.6, 0, -0.3);

  const sphereB = sphere.clone();
  sphereB.position.set(0, 0, 0.3);

  const sphereC = sphere.clone();
  sphereC.position.set(0.2, 0, 0.3);

  const sphereD = sphere.clone();
  sphereD.position.set(0.2, 0, -0.3);

  const sphereE = sphere.clone();
  sphereE.position.set(0, 0.2, -0.3);

  const sphereF = sphere.clone();
  sphereF.position.set(0, 0.2, 0.3);

  const sphereG = sphere.clone();
  sphereG.position.set(0.2, 0.2, 0.3);

  const sphereH = sphere.clone();
  sphereH.position.set(0.2, 0.2, -0.3);

  console.time('operating: ');
  const csg = new CSG();
  // csg.union([
  //   box,
  //   sphere,
  //   sphereB,
  //   sphereC,
  //   sphereD,
  //   sphereE,
  //   sphereF,
  //   sphereG,
  //   sphereH,
  // ]);
  csg.subtract([
    box,
    sphere,
    sphereB,
    sphereC,
    sphereD,
    sphereE,
    sphereF,
    sphereG,
    sphereH,
  ]);
  // csg.intersect([box, sphereB]);
  console.timeEnd('operating: ');
  console.log('csg: ', csg);

  return {
    testMesh: csg.toMesh(),
  };
}

export { testCSG };
