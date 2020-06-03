import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  Vector2,
  Vector3,
  Box3,
} from 'three';

import { BSPNode } from './components/BSPNode.js';
import { Polygon } from './components/Polygon.js';
import { Vertex } from './components/Vertex.js';

// Constructive Solid Geometry (CSG) is a modeling technique that uses Boolean
// operations like union and intersection to combine 3D solids. This library
// implements CSG operations on meshes elegantly and concisely using BSP trees,
// and is meant to serve as an easily understandable implementation of the
// algorithm. All edge cases involving overlapping coplanar polygons in both
// solids are correctly handled.
//
// ## Implementation Details
//
// All CSG operations are implemented in terms of two functions, `clipTo()` and
// `invert()`, which remove parts of a BSP tree inside another BSP tree and swap
// solid and empty space, respectively. To find the union of `a` and `b`, we
// want to remove everything in `a` inside `b` and everything in `b` inside `a`,
// then combine polygons from `a` and `b` into one solid:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     a.build(b.allPolygons());
//
// The only tricky part is handling overlapping coplanar polygons in both trees.
// The code above keeps both copies, but we need to keep them in one tree and
// remove them in the other tree. To remove them from `b` we can clip the
// inverse of `b` against `a`. The code for union now looks like this:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     b.invert();
//     b.clipTo(a);
//     b.invert();
//     a.build(b.allPolygons());
//
// Subtraction and intersection naturally follow from set operations. If
// union is `A | B`, subtraction is `A - B = ~(~A | B)` and intersection is
// `A & B = ~(~A | ~B)` where `~` is the complement operator.
//
// ## License
//
// Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.

// # class CSG

// Holds a binary space partition tree representing a 3D solid. Two solids can
// be combined using the `union()`, `subtract()`, and `intersect()` methods.

class CSG {
  constructor() {
    this.polygons = [];
    this.material = [];
    this.boundingBox = null;
  }

  setFromGeometry(geometry) {
    if (!geometry instanceof BufferGeometry) {
      console.error(
        'This library only works with three.js BufferGeometry',
      );
      return;
    }

    if (geometry.index !== null) {
      geometry = geometry.toNonIndexed();
    }

    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }

    this.boundingBox = geometry.boundingBox;

    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const uvs = geometry.attributes.uv;

    // TODO
    // const colors = geometry.attributes.color;

    function createVertex(index) {
      const position = new Vector3(
        positions.getX(index),
        positions.getY(index),
        positions.getZ(index),
      );
      const normal = normals
        ? new Vector3(
            normals.getX(index),
            normals.getY(index),
            normals.getZ(index),
          )
        : null;

      const uv = uvs
        ? new Vector2(uvs.getX(index), uvs.getY(index))
        : null;

      return new Vertex(position, normal, uv);
    }

    for (let i = 0; i < positions.count; i += 3) {
      const v1 = createVertex(i);
      const v2 = createVertex(i + 1);
      const v3 = createVertex(i + 2);

      this.polygons.push(new Polygon([v1, v2, v3]));
    }

    return this;
  }

  setFromMesh(mesh) {
    mesh.updateMatrixWorld();
    mesh.updateMatrix();

    const transformedGeometry = mesh.geometry.clone();

    transformedGeometry.applyMatrix4(mesh.matrix);

    this.material.push(mesh.material);

    this.setFromGeometry(transformedGeometry);
    return this;
  }

  setPolygons(polygons) {
    this.polygons = polygons;
    return this;
  }

  toMesh() {
    return new Mesh(this.toGeometry(), this.material[0]);
  }

  toGeometry() {
    const geometry = new BufferGeometry();

    const positions = [];
    const normals = [];
    const uvs = [];

    const createFace = (a, b, c) => {
      positions.push(
        a.pos.x,
        a.pos.y,
        a.pos.z,
        b.pos.x,
        b.pos.y,
        b.pos.z,
        c.pos.x,
        c.pos.y,
        c.pos.z,
      );

      // TODO: should not assume that all vertices have the same attributes
      if (a.normal) {
        normals.push(
          a.normal.x,
          a.normal.y,
          a.normal.z,
          b.normal.x,
          b.normal.y,
          b.normal.z,
          c.normal.x,
          c.normal.y,
          c.normal.z,
        );
      }

      if (a.uv) {
        uvs.push(a.uv.x, a.uv.y, b.uv.x, b.uv.y, c.uv.x, c.uv.y);
      }
    };

    for (const polygon of this.polygons) {
      // triangulate the polygon
      for (let i = 0; i <= polygon.vertices.length - 3; i++) {
        createFace(
          polygon.vertices[0],
          polygon.vertices[i + 1],
          polygon.vertices[i + 2],
        );
      }
    }

    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(positions), 3),
    );
    if (normals.length) {
      geometry.setAttribute(
        'normal',
        new BufferAttribute(new Float32Array(normals), 3),
      );
    }
    if (uvs.length) {
      geometry.setAttribute(
        'uv',
        new BufferAttribute(new Float32Array(uvs), 2),
      );
    }

    return geometry;
  }

  clone() {
    const csg = new CSG();
    csg.polygons = this.polygons.map(function (p) {
      return p.clone();
    });
    return csg;
  }

  merge(operand) {
    this.polygons = this.polygons.concat(operand.polygons);
    this.material = this.material.concat(operand.material);
    this.boundingBox.union(operand.boundingBox);
    return this;
  }

  // All CSG operations can be built from a logical or and not operations
  // left || right
  logicalOr(operand) {
    const a = new BSPNode(this.polygons);
    const b = new BSPNode(operand.polygons);
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    this.polygons = a.allPolygons();
    return this;
  }

  // Switch solid and empty space
  // !left
  complement() {
    for (const polygon of this.polygons) {
      polygon.negate();
    }
    this.boundingBox = new Box3(
      this.boundingBox.max,
      this.boundingBox.min,
    );
    return this;
  }

  // Return a new CSG solid representing space in either this solid or in the
  // solid `csg`
  //
  //     A.union(B)
  //
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |       +----+
  //     +----+--+    |       +----+       |
  //          |   B   |            |       |
  //          |       |            |       |
  //          +-------+            +-------+
  //
  // Union/addition/merge
  union(meshes) {
    let operands = this.prepareOperands(meshes);

    // merge an operands that don't intersect this one
    // for (const operand of operands) {
    //   if (!this.boundingBox.intersectsBox(operand.boundingBox)) {
    //     this.merge(operand);
    //     operands.splice(operands.indexOf(operand), 1);
    //   }
    // }

    // This seems to work even when operands overlap
    for (let i = 1; i < operands.length; i++) {
      const operand = operands[i];
      operands[0].merge(operand);
    }

    this.unionOperand(operands[0]);

    // this.mergeNonIntersectingOperands(operands);

    // for (const operand of operands) {
    //   this.material.push(operand.material);
    // }

    return this;
  }

  // (Left || Right)
  unionOperand(operand) {
    return this.logicalOr(operand);
  }

  // Return a new CSG solid representing space in this solid but not in the
  // solid `csg`
  //
  //     A.subtract(B)
  //
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |    +--+
  //     +----+--+    |       +----+
  //          |   B   |
  //          |       |
  //          +-------+
  //
  // subtraction/difference
  // Left && !Right =>
  // !(!Left || Right)
  subtract(meshes) {
    let operands = this.prepareOperands(meshes);

    // remove any operands that don't intersect this one
    // TODO: this is giving false positives
    // operands = operands.filter((operand) => {
    //   if (this.boundingBox.intersectsBox(operand.boundingBox)) {
    //     return operand;
    //   }
    // });

    // This doesn't work when operands overlap
    // for (let i = 1; i < operands.length; i++) {
    //   const operand = operands[i];
    //   operands[0].merge(operand);
    // }

    // this.subtractOperand(operands[0]);

    // This works
    this.mergeNonIntersectingOperands(operands);

    for (const operand of operands) {
      this.subtractOperand(operand);
    }

    return this;
  }

  // !(!Left || Right)
  subtractOperand(operand) {
    this.complement().logicalOr(operand).complement();
  }

  // Return a new CSG solid representing space both this solid and in the
  // solid `csg`
  //
  //     A.intersect(B)
  //
  //     +-------+
  //     |       |
  //     |   A   |
  //     |    +--+----+   =   +--+
  //     +----+--+    |       +--+
  //          |   B   |
  //          |       |
  //          +-------+
  //
  // intersections/common
  // Left && Right =>
  // !(!Left || !Right)
  intersect(meshes) {
    let operands = this.prepareOperands(meshes);

    // if any of the operands don't intersect with this one, or with each other,
    // there will be no polygons left
    // TODO: bbox checks are giving false results
    const nonIntersectingOperands = operands.filter((operand) => {
      if (!this.boundingBox.intersectsBox(operand.boundingBox)) {
        return operand;
      }
    });

    // TODO: check operands for interection with each other and bail early if possible

    // if (!nonIntersectingOperands.length) {
    //   this.polygons = [];
    //   return this;
    // }

    for (const operand of operands) {
      this.material.push(operand.material);
      this.intersectOperand(operand);
    }

    return this;
  }

  // !(!Left || !Right)
  intersectOperand(operand) {
    this.complement().logicalOr(operand.complement()).complement();
  }

  prepareOperands(operands) {
    if (!this.polygons.length) {
      this.setFromMesh(operands[0]);
      operands.shift();
    }

    // convert operands to csg
    return operands.map((operand) => {
      this.material.push(operand.material);
      return new CSG().setFromMesh(operand);
    });
  }

  mergeNonIntersectingOperands(operands) {
    // merge any operands that don't intersect
    let allOverlap = false;
    while (!allOverlap) {
      allOverlap = true;
      for (let i = 0; i < operands.length - 1; i++) {
        const a = operands[i];
        const b = operands[i + 1];
        if (!a.boundingBox.intersectsBox(b.boundingBox)) {
          allOverlap = false;
          a.merge(b);
          operands.splice(operands.indexOf(b), 1);
        }
      }
    }
  }

  allOperandsIntersect(operands) {}
}

export { CSG };
