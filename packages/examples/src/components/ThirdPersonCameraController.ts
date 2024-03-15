import { Matrix4, MOUSE, PerspectiveCamera, Plane, Quaternion, Ray, Spherical, TOUCH, Vector2, Vector3 } from 'three';
import { CameraController } from './CameraController';
import Input from 'unithree/dist/plugin/Input';

// Reused for optimization
const _ray = new Ray();
const _plane = new Plane();
const TILT_LIMIT = Math.cos(70 * (Math.PI / 180));

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or set keys / touch: two-finger move

const moduloWrapAround = (offset: number, capacity: number) => ((offset % capacity) + capacity) % capacity;

export enum ControlState {
  NONE = -1,
  ROTATE,
  DOLLY,
  PAN,
  TOUCH_ROTATE,
  TOUCH_PAN,
  TOUCH_DOLLY_PAN,
  TOUCH_DOLLY_ROTATE,
}

export interface CameraControllerKeys {
  LEFT: string;
  RIGHT: string;
  UP: string;
  DOWN: string;
}

// TODO: Slim down and add custom implementation
//   Try to switch all input to Input Plugin
//   Narrow down the calculation portion and minimize. Smooth target transition not necessary

/**
 * Third Person Camera Controls built as a component.
 * The implementation is based on https://github.com/pmndrs/three-stdlib/blob/main/src/controls/OrbitControls.ts
 */
export class ThirdPersonCameraController extends CameraController<PerspectiveCamera> {
  private input: Input;

  // When false this control is disabled
  private _enabled = true;

  // Reset internals
  protected target0: Vector3;
  protected position0: Vector3;
  protected zoom0: number;

  // Internals
  protected state = ControlState.NONE;

  protected EPS = 0.000001;

  // current position in spherical coordinates
  protected spherical = new Spherical();
  protected sphericalDelta = new Spherical();

  protected scale = 1;
  protected panOffset = new Vector3();

  protected rotateStart = new Vector2();
  protected rotateEnd = new Vector2();
  protected rotateDelta = new Vector2();

  protected panStart = new Vector2();
  protected panEnd = new Vector2();
  protected panDelta = new Vector2();

  protected dollyStart = new Vector2();
  protected dollyEnd = new Vector2();
  protected dollyDelta = new Vector2();

  protected dollyDirection = new Vector3();
  protected mouse = new Vector2();
  protected performCursorZoom = false;

  protected pointers: PointerEvent[] = [];
  protected pointerPositions: { [key: string]: Vector2 } = {};

  public domElement: HTMLElement;

  // "target" sets the location of focus, where the object orbits around
  public target = new Vector3();

  // How far you can dolly in and out ( PerspectiveCamera only )
  public minDistance = 0;
  public maxDistance = Infinity;

  // How far you can zoom in and out ( OrthographicCamera only )
  public minZoom = 0;
  public maxZoom = Infinity;

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  public minPolarAngle = 0; // radians
  public maxPolarAngle = Math.PI; // radians

  // How far you can orbit horizontally, upper and lower limits.
  // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
  public minAzimuthAngle = -Infinity; // radians
  public maxAzimuthAngle = Infinity; // radians

  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  public enableDamping = false;
  public dampingFactor = 0.05;

  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  public enableZoom = true;
  public zoomSpeed = 1.0;

  // Set to false to disable rotating
  public enableRotate = true;
  public rotateSpeed = 1.0;

  // Set to false to disable panning
  public enablePan = true;
  public panSpeed = 1.0;
  public screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up
  public keyPanSpeed = 7.0; // pixels moved per arrow key push
  public zoomToCursor = false;

  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your animation loop
  public autoRotate = false;
  public autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60
  public reverseOrbit = false; // true if you want to reverse the orbit to mouse drag from left to right = orbits left
  public reverseHorizontalOrbit = false; // true if you want to reverse the horizontal orbit direction
  public reverseVerticalOrbit = false; // true if you want to reverse the vertical orbit direction

  // Optional Keyboard input
  public keys: CameraControllerKeys | null = null;

  // Mouse buttons
  public mouseButtons: Partial<{
    LEFT: MOUSE;
    MIDDLE: MOUSE;
    RIGHT: MOUSE;
  }> = {
    LEFT: MOUSE.ROTATE,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.PAN,
  };

  // Touch fingers
  public touches: Partial<{
    ONE: TOUCH;
    TWO: TOUCH;
  }> = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(value: boolean) {
    this._enabled = value;
    this.input.enabled = value;
  }

  constructor(camera: PerspectiveCamera, domElement: HTMLCanvasElement, input: Input) {
    super(camera);
    this.domElement = domElement;

    // For reset
    this.target0 = this.target.clone();
    this.position0 = this.camera.position.clone();
    this.zoom0 = this.camera.zoom;

    this.input = input;

    this.initialize = this.initialize.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.dispose = this.dispose.bind(this);
  }

  public initialize(camera: PerspectiveCamera, domElement: HTMLCanvasElement): void {
    // Setup events
    // disables touch scroll
    // touch-action needs to be defined for pointer events to work on mobile
    // https://stackoverflow.com/a/48254578
    this.domElement.style.touchAction = 'none';
    // this.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('pointercancel', this.onPointerCancel);
    this.domElement.addEventListener('wheel', this.onMouseWheel);
  }

  public onUpdate(): void {
    const offset = new Vector3();
    const up = new Vector3(0, 1, 0);

    // so camera.up is the orbit axis
    const quat = new Quaternion().setFromUnitVectors(this.camera.up, up);
    const quatInverse = quat.clone().invert();

    const lastPosition = new Vector3();
    const lastQuaternion = new Quaternion();

    const twoPI = 2 * Math.PI;
    const position = this.camera.position;

    // Handle Input
    this.handleKeyDown();

    // update new up direction
    quat.setFromUnitVectors(this.camera.up, up);
    quatInverse.copy(quat).invert();

    offset.copy(position).sub(this.target);

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(quat);

    // angle from z-axis around y-axis
    this.spherical.setFromVector3(offset);

    if (this.autoRotate && this.state === ControlState.NONE) {
      this.rotateLeft(this.getAutoRotationAngle());
    }

    if (this.enableDamping) {
      this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
      this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
    } else {
      this.spherical.theta += this.sphericalDelta.theta;
      this.spherical.phi += this.sphericalDelta.phi;
    }

    // restrict theta to be between desired limits

    let min = this.minAzimuthAngle;
    let max = this.maxAzimuthAngle;

    if (isFinite(min) && isFinite(max)) {
      if (min < -Math.PI) min += twoPI;
      else if (min > Math.PI) min -= twoPI;

      if (max < -Math.PI) max += twoPI;
      else if (max > Math.PI) max -= twoPI;

      if (min <= max) {
        this.spherical.theta = Math.max(min, Math.min(max, this.spherical.theta));
      } else {
        this.spherical.theta =
          this.spherical.theta > (min + max) / 2
            ? Math.max(min, this.spherical.theta)
            : Math.min(max, this.spherical.theta);
      }
    }

    // restrict phi to be between desired limits
    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
    this.spherical.makeSafe();

    // move target to panned location

    if (this.enableDamping) {
      this.target.addScaledVector(this.panOffset, this.dampingFactor);
    } else {
      this.target.add(this.panOffset);
    }

    // adjust the camera position based on zoom only if we're not zooming to the cursor or if it's an ortho camera
    // we adjust zoom later in these cases
    if (this.zoomToCursor && this.performCursorZoom) {
      this.spherical.radius = this.clampDistance(this.spherical.radius);
    } else {
      this.spherical.radius = this.clampDistance(this.spherical.radius * this.scale);
    }

    offset.setFromSpherical(this.spherical);

    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(quatInverse);

    position.copy(this.target).add(offset);

    if (!this.camera.matrixAutoUpdate) this.camera.updateMatrix();
    this.camera.lookAt(this.target);

    if (this.enableDamping) {
      this.sphericalDelta.theta *= 1 - this.dampingFactor;
      this.sphericalDelta.phi *= 1 - this.dampingFactor;

      this.panOffset.multiplyScalar(1 - this.dampingFactor);
    } else {
      this.sphericalDelta.set(0, 0, 0);

      this.panOffset.set(0, 0, 0);
    }

    // adjust camera position
    let zoomChanged = false;
    if (this.zoomToCursor && this.performCursorZoom) {
      let newRadius = null;
      // move the camera down the pointer ray
      // this method avoids floating point error
      const prevRadius = offset.length();
      newRadius = this.clampDistance(prevRadius * this.scale);

      const radiusDelta = prevRadius - newRadius;
      this.camera.position.addScaledVector(this.dollyDirection, radiusDelta);
      this.camera.updateMatrixWorld();

      // handle the placement of the target
      if (newRadius !== null) {
        if (this.screenSpacePanning) {
          // position the orbit target in front of the new camera position
          this.target
            .set(0, 0, -1)
            .transformDirection(this.camera.matrix)
            .multiplyScalar(newRadius)
            .add(this.camera.position);
        } else {
          // get the ray and translation plane to compute target
          _ray.origin.copy(this.camera.position);
          _ray.direction.set(0, 0, -1).transformDirection(this.camera.matrix);

          // if the camera is 20 degrees above the horizon then don't adjust the focus target to avoid
          // extremely large values
          if (Math.abs(this.camera.up.dot(_ray.direction)) < TILT_LIMIT) {
            this.camera.lookAt(this.target);
          } else {
            _plane.setFromNormalAndCoplanarPoint(this.camera.up, this.target);
            _ray.intersectPlane(_plane, this.target);
          }
        }
      }
    }

    this.scale = 1;
    this.performCursorZoom = false;

    // update condition is:
    // min(camera displacement, camera rotation in radians)^2 > EPS
    // using small-angle approximation cos(x/2) = 1 - x^2 / 8

    if (
      zoomChanged ||
      lastPosition.distanceToSquared(this.camera.position) > this.EPS ||
      8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > this.EPS
    ) {
      lastPosition.copy(this.camera.position);
      lastQuaternion.copy(this.camera.quaternion);
      zoomChanged = false;
    }
  }

  public dispose(): void {
    // this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointercancel', this.onPointerCancel);
    this.domElement.removeEventListener('wheel', this.onMouseWheel);
    this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!this._enabled) return;

    if (this.pointers.length === 0) {
      this.domElement.ownerDocument.addEventListener('pointermove', this.onPointerMove);
      this.domElement.ownerDocument.addEventListener('pointerup', this.onPointerUp);
    }

    this.addPointer(event);

    if (event.pointerType === 'touch') {
      this.onTouchStart(event);
    } else {
      this.onMouseDown(event);
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this._enabled) return;

    if (event.pointerType === 'touch') {
      this.onTouchMove(event);
    } else {
      this.onMouseMove(event);
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    this.removePointer(event);

    if (this.pointers.length === 0) {
      this.domElement.releasePointerCapture(event.pointerId);

      this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
      this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
    }

    this.state = ControlState.NONE;
  };

  private onPointerCancel = (event: PointerEvent) => {
    this.removePointer(event);
  };

  private onMouseDown = (event: MouseEvent) => {
    let mouseAction;

    switch (event.button) {
      case 0:
        mouseAction = this.mouseButtons.LEFT;
        break;

      case 1:
        mouseAction = this.mouseButtons.MIDDLE;
        break;

      case 2:
        mouseAction = this.mouseButtons.RIGHT;
        break;

      default:
        mouseAction = -1;
    }

    switch (mouseAction) {
      case MOUSE.DOLLY:
        if (!this.enableZoom) return;
        this.handleMouseDownDolly(event);
        this.state = ControlState.DOLLY;
        break;

      case MOUSE.ROTATE:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (!this.enablePan) return;
          this.handleMouseDownPan(event);
          this.state = ControlState.PAN;
        } else {
          if (!this.enableRotate) return;
          this.handleMouseDownRotate(event);
          this.state = ControlState.ROTATE;
        }
        break;

      case MOUSE.PAN:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (!this.enableRotate) return;
          this.handleMouseDownRotate(event);
          this.state = ControlState.ROTATE;
        } else {
          if (!this.enablePan) return;
          this.handleMouseDownPan(event);
          this.state = ControlState.PAN;
        }
        break;

      default:
        this.state = ControlState.NONE;
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this._enabled) return;

    switch (this.state) {
      case ControlState.ROTATE:
        if (!this.enableRotate) return;
        this.handleMouseMoveRotate(event);
        break;

      case ControlState.DOLLY:
        if (!this.enableZoom) return;
        this.handleMouseMoveDolly(event);
        break;

      case ControlState.PAN:
        if (!this.enablePan) return;
        this.handleMouseMovePan(event);
        break;
    }
  };

  private onMouseWheel = (event: WheelEvent) => {
    if (
      !this._enabled ||
      !this.enableZoom ||
      (this.state !== ControlState.NONE && this.state !== ControlState.ROTATE)
    ) {
      return;
    }

    event.preventDefault();

    this.handleMouseWheel(event);
  };

  private onTouchStart = (event: PointerEvent) => {
    this.trackPointer(event);

    switch (this.pointers.length) {
      case 1:
        switch (this.touches.ONE) {
          case TOUCH.ROTATE:
            if (!this.enableRotate) return;
            this.handleTouchStartRotate();
            this.state = ControlState.TOUCH_ROTATE;
            break;

          case TOUCH.PAN:
            if (!this.enablePan) return;
            this.handleTouchStartPan();
            this.state = ControlState.TOUCH_PAN;
            break;

          default:
            this.state = ControlState.NONE;
        }

        break;

      case 2:
        switch (this.touches.TWO) {
          case TOUCH.DOLLY_PAN:
            if (!this.enableZoom && !this.enablePan) return;
            this.handleTouchStartDollyPan();
            this.state = ControlState.TOUCH_DOLLY_PAN;
            break;

          case TOUCH.DOLLY_ROTATE:
            if (!this.enableZoom && !this.enableRotate) return;
            this.handleTouchStartDollyRotate();
            this.state = ControlState.TOUCH_DOLLY_ROTATE;
            break;

          default:
            this.state = ControlState.NONE;
        }

        break;

      default:
        this.state = ControlState.NONE;
    }
  };

  private onTouchMove = (event: PointerEvent) => {
    this.trackPointer(event);

    switch (this.state) {
      case ControlState.TOUCH_ROTATE:
        if (!this.enableRotate) return;
        this.handleTouchMoveRotate(event);
        break;

      case ControlState.TOUCH_PAN:
        if (!this.enablePan) return;
        this.handleTouchMovePan(event);
        break;

      case ControlState.TOUCH_DOLLY_PAN:
        if (!this.enableZoom && !this.enablePan) return;
        this.handleTouchMoveDollyPan(event);
        break;

      case ControlState.TOUCH_DOLLY_ROTATE:
        if (!this.enableZoom && !this.enableRotate) return;
        this.handleTouchMoveDollyRotate(event);
        break;

      default:
        this.state = ControlState.NONE;
    }
  };

  private addPointer(event: PointerEvent) {
    this.pointers.push(event);
  }

  private removePointer(event: PointerEvent) {
    delete this.pointerPositions[event.pointerId];

    for (let i = 0; i < this.pointers.length; i++) {
      if (this.pointers[i].pointerId == event.pointerId) {
        this.pointers.splice(i, 1);
        return;
      }
    }
  }

  private trackPointer(pointerEvent: PointerEvent) {
    if (pointerEvent) {
      let position = this.pointerPositions[pointerEvent.pointerId];

      if (position === undefined) {
        position = new Vector2();
        this.pointerPositions[pointerEvent.pointerId] = position;
      }

      position.set(pointerEvent.pageX, pointerEvent.pageY);
    }
  }

  private getSecondPointerPosition(event: PointerEvent) {
    const pointer = event?.pointerId === this.pointers[0].pointerId ? this.pointers[1] : this.pointers[0];
    return this.pointerPositions[pointer.pointerId];
  }

  private clampDistance = (dist: number): number => {
    return Math.max(this.minDistance, Math.min(this.maxDistance, dist));
  };

  private rotateLeft = (angle: number): void => {
    if (this.reverseOrbit || this.reverseHorizontalOrbit) {
      this.sphericalDelta.theta += angle;
    } else {
      this.sphericalDelta.theta -= angle;
    }
  };

  private rotateUp = (angle: number): void => {
    if (this.reverseOrbit || this.reverseVerticalOrbit) {
      this.sphericalDelta.phi += angle;
    } else {
      this.sphericalDelta.phi -= angle;
    }
  };

  private getAutoRotationAngle = (): number => {
    return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed;
  };

  private handleMouseDownRotate = (event: MouseEvent) => {
    this.rotateStart.set(event.clientX, event.clientY);
  };

  private handleMouseDownDolly = (event: MouseEvent) => {
    this.updateMouseParameters(event);
    this.dollyStart.set(event.clientX, event.clientY);
  };

  private handleMouseDownPan = (event: MouseEvent) => {
    this.panStart.set(event.clientX, event.clientY);
  };

  private handleMouseMoveRotate = (event: MouseEvent) => {
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

    const element = this.domElement;

    if (element) {
      this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight); // yes, height
      this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);
    }
    this.rotateStart.copy(this.rotateEnd);
    // this.update();
  };

  private handleMouseMoveDolly = (event: MouseEvent) => {
    this.dollyEnd.set(event.clientX, event.clientY);
    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

    if (this.dollyDelta.y > 0) {
      this.dollyOut(this.getZoomScale());
    } else if (this.dollyDelta.y < 0) {
      this.dollyIn(this.getZoomScale());
    }

    this.dollyStart.copy(this.dollyEnd);
    // this.update();
  };

  private handleMouseMovePan = (event: MouseEvent) => {
    this.panEnd.set(event.clientX, event.clientY);
    this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
    // this.update();
  };

  private handleMouseWheel = (event: WheelEvent) => {
    this.updateMouseParameters(event);

    if (event.deltaY < 0) {
      this.dollyIn(this.getZoomScale());
    } else if (event.deltaY > 0) {
      this.dollyOut(this.getZoomScale());
    }

    // this.update();
  };

  private handleKeyDown = () => {
    if (!this._enabled || !this.enablePan || !this.keys) return;

    if (this.input.getKeyDown(this.keys.UP)) {
      this.pan(0, this.keyPanSpeed);
    } else if (this.input.getKeyDown(this.keys.DOWN)) {
      this.pan(0, -this.keyPanSpeed);
    }

    if (this.input.getKeyDown(this.keys.LEFT)) {
      this.pan(this.keyPanSpeed, 0);
    } else if (this.input.getKeyDown(this.keys.RIGHT)) {
      this.pan(-this.keyPanSpeed, 0);
    }
  };

  private handleTouchStartRotate = () => {
    if (this.pointers.length == 1) {
      this.rotateStart.set(this.pointers[0].pageX, this.pointers[0].pageY);
    } else {
      const x = 0.5 * (this.pointers[0].pageX + this.pointers[1].pageX);
      const y = 0.5 * (this.pointers[0].pageY + this.pointers[1].pageY);

      this.rotateStart.set(x, y);
    }
  };

  private handleTouchStartPan = () => {
    if (this.pointers.length == 1) {
      this.panStart.set(this.pointers[0].pageX, this.pointers[0].pageY);
    } else {
      const x = 0.5 * (this.pointers[0].pageX + this.pointers[1].pageX);
      const y = 0.5 * (this.pointers[0].pageY + this.pointers[1].pageY);

      this.panStart.set(x, y);
    }
  };

  private handleTouchStartDolly = () => {
    const dx = this.pointers[0].pageX - this.pointers[1].pageX;
    const dy = this.pointers[0].pageY - this.pointers[1].pageY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.dollyStart.set(0, distance);
  };

  private handleTouchStartDollyPan = () => {
    if (this.enableZoom) this.handleTouchStartDolly();
    if (this.enablePan) this.handleTouchStartPan();
  };

  private handleTouchStartDollyRotate = () => {
    if (this.enableZoom) this.handleTouchStartDolly();
    if (this.enableRotate) this.handleTouchStartRotate();
  };

  private handleTouchMoveRotate = (event: PointerEvent) => {
    if (this.pointers.length == 1) {
      this.rotateEnd.set(event.pageX, event.pageY);
    } else {
      const position = this.getSecondPointerPosition(event);
      const x = 0.5 * (event.pageX + position.x);
      const y = 0.5 * (event.pageY + position.y);
      this.rotateEnd.set(x, y);
    }

    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

    const element = this.domElement;

    if (element) {
      this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight); // yes, height
      this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);
    }
    this.rotateStart.copy(this.rotateEnd);
  };

  private handleTouchMovePan = (event: PointerEvent) => {
    if (this.pointers.length == 1) {
      this.panEnd.set(event.pageX, event.pageY);
    } else {
      const position = this.getSecondPointerPosition(event);
      const x = 0.5 * (event.pageX + position.x);
      const y = 0.5 * (event.pageY + position.y);
      this.panEnd.set(x, y);
    }

    this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
    this.pan(this.panDelta.x, this.panDelta.y);
    this.panStart.copy(this.panEnd);
  };

  private handleTouchMoveDolly = (event: PointerEvent) => {
    const position = this.getSecondPointerPosition(event);
    const dx = event.pageX - position.x;
    const dy = event.pageY - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.dollyEnd.set(0, distance);
    this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));
    this.dollyOut(this.dollyDelta.y);
    this.dollyStart.copy(this.dollyEnd);
  };

  private handleTouchMoveDollyPan = (event: PointerEvent) => {
    if (this.enableZoom) this.handleTouchMoveDolly(event);
    if (this.enablePan) this.handleTouchMovePan(event);
  };

  private handleTouchMoveDollyRotate = (event: PointerEvent) => {
    if (this.enableZoom) this.handleTouchMoveDolly(event);
    if (this.enableRotate) this.handleTouchMoveRotate(event);
  };

  private updateMouseParameters = (event: MouseEvent): void => {
    if (!this.zoomToCursor || !this.domElement) {
      return;
    }

    this.performCursorZoom = true;

    const rect = this.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    this.mouse.x = (x / w) * 2 - 1;
    this.mouse.y = -(y / h) * 2 + 1;

    this.dollyDirection.set(this.mouse.x, this.mouse.y, 1).unproject(this.camera).sub(this.camera.position).normalize();
  };

  private dollyOut = (dollyScale: number) => {
    this.scale /= dollyScale;
  };

  private dollyIn(dollyScale: number) {
    this.scale *= dollyScale;
  }

  private getZoomScale = (): number => {
    return Math.pow(0.95, this.zoomSpeed);
  };

  private panLeft = (distance: number, objectMatrix: Matrix4) => {
    const v = new Vector3();

    v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
    v.multiplyScalar(-distance);

    this.panOffset.add(v);
  };

  private panUp = (distance: number, objectMatrix: Matrix4) => {
    const v = new Vector3();

    if (this.screenSpacePanning) {
      v.setFromMatrixColumn(objectMatrix, 1);
    } else {
      v.setFromMatrixColumn(objectMatrix, 0);
      v.crossVectors(this.camera.up, v);
    }

    v.multiplyScalar(distance);

    this.panOffset.add(v);
  };

  // deltaX and deltaY are in pixels; right and down are positive
  private pan = (deltaX: number, deltaY: number) => {
    const offset = new Vector3();

    const element = this.domElement;

    // perspective
    const position = this.camera.position;
    offset.copy(position).sub(this.target);
    let targetDistance = offset.length();

    // half of the fov is center to top of screen
    targetDistance *= Math.tan(((this.camera.fov / 2) * Math.PI) / 180.0);

    // we use only clientHeight here so aspect ratio does not distort speed
    this.panLeft((2 * deltaX * targetDistance) / element.clientHeight, this.camera.matrix);
    this.panUp((2 * deltaY * targetDistance) / element.clientHeight, this.camera.matrix);
  };
}
