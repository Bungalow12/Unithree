import { Box3, Object3D, PerspectiveCamera, Plane, Quaternion, Ray, Spherical, Vector2, Vector3 } from 'three';
import { CameraController } from './CameraController';
import Input, { InputType, PointerButton, PointerState } from 'unithree/dist/plugin/Input';

// Reused for optimization
const _ray = new Ray();
const _plane = new Plane();
const TILT_LIMIT = Math.cos(70 * (Math.PI / 180));
const reusableVector1 = new Vector2();
const reusableVector2 = new Vector2();

const reusableBox = new Box3();
const reusableVector3 = new Vector3();

export interface CameraControllerKeys {
  Left: string;
  Right: string;
  Up: string;
  Down: string;
}

/**
 * Third Person Camera Controls built as a component.
 * The implementation is based on https://github.com/pmndrs/three-stdlib/blob/main/src/controls/OrbitControls.ts
 * Supported input is Mouse, Pen, Touch and Keyboard for handling rotation and zoom.
 */
export class ThirdPersonCameraController extends CameraController<PerspectiveCamera> {
  private input: Input;

  // When false this control is disabled
  private _enabled = true;

  // Internals
  protected EPS = 0.000001;

  // current position in spherical coordinates
  protected spherical = new Spherical();
  protected sphericalDelta = new Spherical();

  protected scale = 1;
  protected dollyDelta = new Vector2();

  protected dollyDirection = new Vector3();
  protected performCursorZoom = false;

  public domElement: HTMLElement;

  // "target" sets the location of focus, where the object orbits around
  public target = new Object3D();

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

  // This option actually enables dolly in and out; left as "zoom" for backwards compatibility.
  // Set false to disable zooming
  public enableZoom = true;
  public zoomSpeed = 1.0;

  // Set to false to disable rotating
  public enableRotate = true;
  public rotateSpeed = 1.0;
  public keyRotateSpeed = 0.01 * Math.PI; // pixels moved per arrow key push

  public zoomToCursor = false;

  // Set to true to automatically rotate around the target
  public reverseOrbit = false; // true if you want to reverse the orbit to mouse drag from left to right = orbits left
  public reverseHorizontalOrbit = false; // true if you want to reverse the horizontal orbit direction
  public reverseVerticalOrbit = false; // true if you want to reverse the vertical orbit direction

  // Optional Keyboard input
  public keys: CameraControllerKeys | null = null;

  /**
   * Get the enabled state
   * @returns {boolean} true if enabled
   */
  public get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Sets the enabled state
   * @param {boolean} value true if enabled otherwise false
   */
  public set enabled(value: boolean) {
    this._enabled = value;
    this.input.enabled = value;
  }

  constructor(camera: PerspectiveCamera, domElement: HTMLCanvasElement, input: Input) {
    super(camera);
    this.domElement = domElement;

    this.input = input;

    this.onUpdate = this.onUpdate.bind(this);
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

    // Handle input via the Input plugin
    this.handlePointerInput();
    this.handleMouseWheelInput();
    this.handleKeyboardInput();

    // REFERENCE: The following code comes from the OrbitControls from ThreeStdLib
    //   https://github.com/pmndrs/three-stdlib/blob/main/src/controls/OrbitControls.ts#L203-L395

    const center = reusableBox.setFromObject(this.target).getCenter(reusableVector3);

    // Update new up direction
    quat.setFromUnitVectors(this.camera.up, up);
    quatInverse.copy(quat).invert();

    offset.copy(position).sub(center);

    // Rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(quat);

    // Angle from z-axis around y-axis
    this.spherical.setFromVector3(offset);

    if (this.enableDamping) {
      this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
      this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
    } else {
      this.spherical.theta += this.sphericalDelta.theta;
      this.spherical.phi += this.sphericalDelta.phi;
    }

    // Restrict theta to be between desired limits

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

    // Restrict phi to be between desired limits
    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
    this.spherical.makeSafe();

    // Adjust the camera position based on zoom only if we're not zooming to the cursor
    if (this.zoomToCursor && this.performCursorZoom) {
      this.spherical.radius = this.clampDistance(this.spherical.radius);
    } else {
      this.spherical.radius = this.clampDistance(this.spherical.radius * this.scale);
    }

    offset.setFromSpherical(this.spherical);

    // Rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(quatInverse);

    position.copy(center).add(offset);

    if (!this.camera.matrixAutoUpdate) this.camera.updateMatrix();
    this.camera.lookAt(center);

    if (this.enableDamping) {
      this.sphericalDelta.theta *= 1 - this.dampingFactor;
      this.sphericalDelta.phi *= 1 - this.dampingFactor;
    } else {
      this.sphericalDelta.set(0, 0, 0);
    }

    // Adjust camera position
    let zoomChanged = false;
    if (this.zoomToCursor && this.performCursorZoom) {
      let newRadius = null;
      // Move the camera down the pointer ray
      // This method avoids floating point error
      const prevRadius = offset.length();
      newRadius = this.clampDistance(prevRadius * this.scale);

      const radiusDelta = prevRadius - newRadius;
      this.camera.position.addScaledVector(this.dollyDirection, radiusDelta);
      this.camera.updateMatrixWorld();

      // Handle the placement of the target
      if (newRadius !== null) {
        // get the ray and translation plane to compute target
        _ray.origin.copy(this.camera.position);
        _ray.direction.set(0, 0, -1).transformDirection(this.camera.matrix);

        // If the camera is 20 degrees above the horizon then don't adjust the focus target to avoid
        // extremely large values
        if (Math.abs(this.camera.up.dot(_ray.direction)) < TILT_LIMIT) {
          this.camera.lookAt(center);
        } else {
          _plane.setFromNormalAndCoplanarPoint(this.camera.up, center);
          _ray.intersectPlane(_plane, center);
        }
      }
    }

    this.scale = 1;
    this.performCursorZoom = false;

    // Update condition is:
    // min(camera displacement, camera rotation in radians)^2 > EPS
    // Using small-angle approximation cos(x/2) = 1 - x^2 / 8

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

  private handlePointerInput = () => {
    const mouseState = this.input.getPrimaryPointerState(InputType.Mouse);

    if (mouseState) {
      if (mouseState.getPointerButtonDown(PointerButton.Primary)) {
        this.handlePointerRotate(mouseState);
      }
    }

    const penState = this.input.getPrimaryPointerState(InputType.Pen);

    if (penState) {
      this.handlePointerRotate(penState);
    }

    const touchCount = this.input.touchCount;

    if (touchCount === 1) {
      const touchState = this.input.getPrimaryPointerState(InputType.Touch);
      if (touchState) {
        this.handlePointerRotate(touchState);
      }
    } else if (touchCount === 2) {
      this.handleTouchZoom(this.input.getPointerStates(InputType.Touch));
    }
  };

  private handleMouseWheelInput = () => {
    // this.updateMouseParameters(event);
    const delta = this.input.getMouseScrollDelta();
    if (delta.y < 0) {
      this.dollyIn(this.getZoomScale());
    } else if (delta.y > 0) {
      this.dollyOut(this.getZoomScale());
    }
  };

  private handleKeyboardInput = () => {
    if (!this._enabled || !this.enableRotate || !this.keys) return;

    if (this.input.getKeyDown(this.keys.Up)) {
      this.rotateUp(this.keyRotateSpeed);
    } else if (this.input.getKeyDown(this.keys.Down)) {
      this.rotateUp(-this.keyRotateSpeed);
    }

    if (this.input.getKeyDown(this.keys.Left)) {
      this.rotateLeft(this.keyRotateSpeed);
    } else if (this.input.getKeyDown(this.keys.Right)) {
      this.rotateLeft(-this.keyRotateSpeed);
    }
  };

  private handlePointerRotate = (pointerState: PointerState) => {
    const delta = pointerState.delta;
    const element = this.domElement;

    if (element) {
      this.rotateLeft((2 * Math.PI * delta.x) / element.clientHeight); // yes, height
      this.rotateUp((2 * Math.PI * delta.y) / element.clientHeight);
    }
  };

  private handleTouchZoom = (pointerStates: PointerState[]) => {
    const touchOne = pointerStates.filter((state) => state.isPrimary)[0];
    const touchTwo = pointerStates.filter((state) => !state.isPrimary)[0];

    if (touchOne && touchTwo) {
      reusableVector1.set(touchOne.coordinates.x, touchOne.coordinates.y);
      reusableVector1.set(touchTwo.coordinates.x, touchTwo.coordinates.y);
      const touchOnePositionLastFrame = reusableVector1.sub(touchOne.delta);
      const touchTwoPositionLastFrame = reusableVector2.sub(touchTwo.delta);

      let dx = touchOnePositionLastFrame.x - touchTwoPositionLastFrame.x;
      let dy = touchOnePositionLastFrame.y - touchTwoPositionLastFrame.y;
      const startingDistance = Math.sqrt(dx * dx + dy * dy);

      dx = touchOne.coordinates.x - touchTwo.coordinates.x;
      dy = touchOne.coordinates.y - touchTwo.coordinates.y;
      const endingDistance = Math.sqrt(dx * dx + dy * dy);

      this.dollyDelta.set(0, Math.pow(endingDistance / startingDistance, this.zoomSpeed));
      this.dollyOut(this.dollyDelta.y);
    }
  };

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

  private dollyOut = (dollyScale: number) => {
    this.scale /= dollyScale;
  };

  private dollyIn(dollyScale: number) {
    this.scale *= dollyScale;
  }

  private getZoomScale = (): number => {
    return Math.pow(0.95, this.zoomSpeed);
  };
}
