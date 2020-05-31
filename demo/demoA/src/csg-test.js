import {
  BoxBufferGeometry,
  CylinderBufferGeometry,
  BufferAttribute,
  BufferGeometry,
  PlaneBufferGeometry,
  SphereBufferGeometry,
  MeshNormalMaterial,
} from '../../../node_modules/three/build/three.module.js';

import { CSG } from '../../../build/csg.module.js';

function createGeo(positions) {
  const geometry = new BufferGeometry();

  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  );

  return geometry;
}

function testCSG(params) {
  // prettier-ignore
  const triangle = createGeo([
    -0.2, -0.2,  0,
    0.2, -0.2,  0,
    0.2,  0.2,  0,
  ] );

  // prettier-ignore
  const triangleUp = createGeo([
    -0.2, -0.2,  0,
    0.2,  0.2,  0,
    -0.2, 0.2,  0,
  ] );

  // prettier-ignore
  const square = createGeo([
    -0.2, -0.2,  0,
    0.2, -0.2,  0,
    0.2,  0.2,  0,

    0.2,  0.2,  0,
    -0.2,  0.2,  0,
    -0.2, -0.2,  0
  ]);

  const box = new BoxBufferGeometry(0.2, 0.2, 1);
  const cylinder = new CylinderBufferGeometry(0.2, 0.2, 1);
  const plane = new PlaneBufferGeometry(0.2, 0.2);
  const sphere = new SphereBufferGeometry(0.2);

  const triangleCSG = new CSG().fromGeometry(triangle);
  // console.log('triangleCSG: ', triangleCSG, triangleCSG.toGeometry());
  const triangleUpCSG = new CSG().fromGeometry(triangleUp);
  // console.log('triangleUpCSG: ', triangleUpCSG);
  const squareCSG = new CSG().fromGeometry(square);
  // console.log('squareCSG: ', squareCSG);
  const planeCSG = new CSG().fromGeometry(plane);
  // console.log('planeCSG: ', plane, planeCSG);
  const boxCSG = new CSG().fromGeometry(box);
  const boxBCSG = new CSG().fromGeometry(
    new BoxBufferGeometry(0.3, 0.3, 0.3),
  );
  const cylinderCSG = new CSG().fromGeometry(cylinder);
  // console.log('cylinderCSG: ', cylinder, cylinderCSG);
  const sphereCSG = new CSG().fromGeometry(sphere);
  // console.log('sphereCSG: ', sphere, sphereCSG);

  const testTriangle = () => {
    const test = triangleCSG.union(triangleUpCSG);
    // console.log(
    //   'triangle: ',
    //   triangleCSG.toGeometry().attributes.position.array,
    // );
    // console.log(
    //   'triangleUp: ',
    //   triangleUpCSG.toGeometry().attributes.position.array,
    // );
    // console.log(
    //   'test: ',
    //   test.toGeometry().attributes.position.array,
    // );

    return test;
  };

  const testBox = () => {
    // console.log('boxCSG: ', box, boxCSG);
    // const test = boxCSG.union(boxBCSG);
    // const test = boxCSG.subtract(boxBCSG);
    const test = boxCSG.intersect(boxBCSG);
    console.log('test: ', test.polygons);
    console.log('test: ', test.toGeometry().attributes.position);

    return test;
  };

  const testSphereBox = () => {
    // console.log('boxCSG: ', box, boxCSG);
    // const test = boxCSG.union(sphereCSG);
    // const test = boxCSG.subtract(sphereCSG);
    const test = boxCSG.intersect(sphereCSG);

    console.log('test: ', test.polygons);
    console.log('test: ', test.toGeometry().attributes.position);

    return test;
  };

  // const test = testTriangle();
  // const test = testBox();
  const test = testSphereBox();

  return {
    triangle: triangleCSG.toGeometry(),
    triangleUp: triangleUpCSG.toGeometry(),
    triangleOrig: triangle,
    square: squareCSG.toGeometry(),
    squareOrig: square,
    plane: planeCSG.toGeometry(),
    planeOrig: plane.toNonIndexed(),
    box: boxCSG.toGeometry(),
    boxB: boxBCSG.toGeometry(),
    boxOrig: box.toNonIndexed(),
    cylinder: cylinderCSG.toGeometry(),
    cylinderOrig: cylinder.toNonIndexed(),
    sphere: sphereCSG.toGeometry(),
    sphereOrig: sphere.toNonIndexed(),
    test: test.toGeometry(),
  };
}

export { testCSG };
