# Unithree

## Overview

A 3D framework built on the highly performant [ThreeJS](https://threejs.org/) with the intention of being easy to pickup
for users of [Unity 3D](https://unity.com). This is not a recreation of Unity 3D but a highly extensible framework
inspired by it and entity/component models.

## Documentation

### Setup

This is a ThreeJS based project so when installing via NPM please use:

```bash
npm install three @types/three @unithree/core
```

### Core Concepts

Unithree is built around a central state that houses the frame loop. This provides the processing of
Entities calling their `OnStart`, `OnUpdate`, `OnLateUpdate`, and `OnDestroy` events.

An `Entity` can be basic, just providing a means to ensure any `Object3D` is can respond to the core events.
Entities can also have Components attached.

A `Component` is a simple interface only requiring a reference to their parent Entity. Beyond that the implementation
is up to the `Component`. This means you can add any functionality to the parent `Entity`, such as physics,
interaction, animations, etc...

Finally, we have ProcessorPlugins. A `ProcessorPlugin` is meant to add whatever functionality you desire to the main
loop. This is done via `initialize`, `update`, `lateUpdate`, and `dispose` events.
This can include the processing of specific custom `Component` types.

With these simple pieces you can build a robust real-time interactive application on top of one of the most widely used
WebGL rendering engines.

### Library

#### Unithree State

*The state maintains the scene, active camera, and renderer elements. It is responsible for calling the core events for
`Entity` and `ProcessorPlugin` types.*

---

* `initialize` - Initializes the Unithree state clearing anything previously in the state. This takes optional camera
  camera and renderer options returning the HTML Canvas Element. By default, a new `PerspectiveCamera` and a
  `WebGlRenderer` will be created.
* `start` - Starts the frame loop.
* `stop` - Stops the frame loop.
* `isPaused` - This property gets and sets the paused state of the system. This is reported to every
  `ProcessorPlugin` and `Entity`.
* `addPlugin` - Adds 1 or more `ProcessorPlugin` objects into the system.
* `clearPlugins` - Clears all plugins added to the system. This will call dispose on all plugins.
* `getPluginByTypeName` - Looks for a plugin by the name of the class (e.g. "Input") and will return it or null if
  the requested plugin was not found.
* `getScene` - Gets the scene containing all `ThreeJS` objects including `Entity` objects. *(Do **NOT** perform
  scene
  management here. Object lifecycle should be handled by the state. See `instantiateObject` and `Entity.destroy`)*
* `getCamera` - Gets the active camera of the system.
* `setCamera` - Sets the active camera of the system.
* `getRenderer` - Gets the current renderer.
* `getClock` - Gets the clock maintained by the system. **NOTE: the time is given to all update events so this is not
  recommended for direct use**
* `instantiateObject` - Creates a new object and adds it to the scene root or optional `Object3D` or `Entity`.
* `findObjectByName` - Finds the first object or `Entity` that has a matching name in the scene hierarchy.
* `findObjectsByName` - Finds the all objects or entities that have a matching name in the scene hierarchy.
* `findEntityByName` - Finds the first `Entity` that has a matching name in the scene hierarchy.
* `findEntitiesByName` - Finds the all `Entity` objects that have a matching name in the scene hierarchy.
* `getEntities` - Gets a list of all `Entity` objects tracked by the system.
* `dispose` - Stops and cleans up the system ensuring dispose id called on all `Entity` and `ProcessorPlugin` objects.

##### Processor Plugin

*Meant to extend the functionality of the core render loop. These are also used to process custom `Component` objects.*

---

* `enabled` - A flag determining whether the plugin is enabled.
* `initialized` - A flag representing whether the plugin has initialized.
* `initialize` - Executed one time when the plugin starts. *This will NOT occur unless the state has been
  initialized and started.*
* `update` - Executed once per frame.
* `lateUpdate` - Executed after all `ProcessorPlugin` and `Entity` object updates.
* `dispose` - Executed when the system state shutdown has been requested. Use this for clean up of itself and any   
  controlled `Component` objects if they need it.

##### Entity

*Extending `Object3D` this object provides state-based events and allows them to attach `Component` objects*

---

* `didStart` - A flag representing whether the `Entity` has started.
* `isDead` - Get whether the `Entity` has died.
* `enabled` - A flag representing whether the `Entity` is enabled.
* `components` - Gets a list of the attached `Component` objects.
* `addComponents` - Add a 1 or more `Component` objects to an `Entity`. Auto-sets the `Entity`/`Component` relationship.
* `destroy` - Tells the system to destroy the `Entity` on the next update.
* `OnStart` - Event called once on an `Entity` when it starts.
* `OnUpdate` - Event once per frame post render.
* `OnLateUpdate` - Event called once per frame after the update event.
* `OnDestroy` - Event called when the system processed the `Entity` death. *(Use for any cleanup)*

##### Component

*Interface requiring an entity as its parent object. A `Component` can add any extra processing and events supported
by a `ProcessorPlugin`. An `Entity` does **NOT** know nor assume it has any `Component` objects by default.*

##### Input Plugin

*Plugin that provides an easy way to process input without setting up your own input handlers. The `Input` plugin
provides support for Keyboard, Mouse, Pen, Touch, and Gamepads*

---

###### Input

* `getPointerCoordinates` - Get the specified pointer coordinates in reference to the window
* `getPointerDelta` - Gets the pointer coordinate delta since last frame
* `getPrimaryPointerState` - Gets the primary pointer state object for the specified input type
* `getPointerStates` - Gets a list of pointer states for the given input type
* `touchCount` - Gets the number of touches currently active in the system
* `getMouseScrollDelta` - Gets the delta of the mouse scroll wheel since last frame
* `mouseScrollDeltaMode` - Gets the mode of the scroll wheel
* `getGamepad` - Gets the gamepad state object for the specified player index
* `getGamepads` - Gets the active gamepad state objects
* `getKeyHeld` - True if the key has been held but not pressed this frame
* `getKeyPressed` - True if the key has been pressed this frame
* `getKeyDown` - True if the key was pressed or is being held
* `getKeyUp` - True if the key was released this frame

###### Pointer State

* `type` - The type of the input
* `isPrimary` - True if the pointer is the primary pointer of its type
* `coordinates` - The pointer's coordinates in reference to the window
* `delta` - The pointer's coordinate delta this frame
* `buttonStates` - Map of pointer buttons to state
* `getButtonState` - Gets the state of the specific pointer button
* `setButtonState` - Sets the state of the specific pointer button
* `getButtonHeld` - True if the button is held but has not been pressed this frame
* `getButtonPressed` - True if the button is pressed this frame
* `getButtonDown` - True if the button was pressed or is held
* `getButtonUp` - True if the button was released this frame

###### Gamepad State

* `playerIndex` - The index for which player the gamepad is associated with
* `lastUpdated` - The timestamp of the most recent update
* `totalAxes` - The number of axes available on the gamepad
* `totalButtons` - The number of buttons available on the gamepad
* `hasStandardMapping` - Whether or not standard mappings are supported. (This is commonly PlayStation and XBox
  controllers)
* `buttonStates` - Gets a map of buttons to state
* `getAxis` - Gets the axis value from -1 to 1 of the specified axis
* `getThumbstickValue` - Gets a `Vector2` of the thumb stick on a standard gamepad
* `getButtonTouchedState` - Gets the state foa button if it is being touched (capacitive buttons only otherwise it
  matches button state)
* `getButtonValue` - Gets the value of the specified button between 0 and 1
* `getButtonState` - Gets the state of the specified button
* `setButtonState` - Sets the state of the specified button
* `getButtonHeld` - True if the button is being held but eas not pressed this frame
* `getButtonPressed` - True if the button was pressed this frame
* `getButtonDown` - True if the button was pressed or is being held
* `getButtonUp` - True if the button was released this frame

###### Misc

* `ButtonState` - Pressed, Held or Released
* `PointerButton` - Primary, Secondary or Auxiliary
* `InputType` - Mouse, Pen or Touch
* `ThumbStick` - Left or Right (Used for standard controllers)
* `PlaystationButtonMapping` - Mapping for a PlayStation controller
* `XBoxButtonMapping`- Mapping for an XBox controller
* `SwitchButtonMapping` - Mapping for a Nintendo Switch Controller

##### Math Utility Functions

*Small set of Utility functions related to Math*

---

* `EPSILON` - A value of 10<sup>-5</sup>.
* `PI_2` - A value of PI * 2.
* `PI_HALF` - A value of PI / 2.
* `FPS_60` - A value representing 60 FPS.
* `ORIGIN` - A `Vector3` representing the origin.
* `AXIS_X` - A `Vector3` representing the X-axis.
* `AXIS_Y` - A `Vector3` representing the Y-axis.
* `AXIS_Z` - A `Vector3` representing the Z-axis.
* `approximatelyZero` - Compares a number with approximately zero.
* `approximatelyEquals` - Compares two numbers for approximate equality.
* `sphericalEquals` - Compares two `Spherical` objects for equality.
* `approximatelySphericalEquals` - Compares two `Spherical` objects for approximate equality.
* `approximatelyVector3Equals` - Compares two `Vector3` objects for approximate equality.

### Unity 3D to Unithree Concepts

Below is a quick guide to aid those familiar with `Unity 3D` concepts make the connection to similar concepts in
Unithree.

#### Prefabs and Scripts

Since a prefab is an easily instantiated preconfigured game object, with set values, children, components, etc...
the best way to replicate this is making a new class and extending the `Entity` class. In this new class, you
would create and add children and components in the constructor so that these objects are always associated.

As for adding custom scripting, such as adding a `MonoBehaviour`, the custom new `Entity` class can have the
behaviors built into it.

#### Components

In `Unity 3D` adding a component extends the game object adding new functionality, such as adding physics,
collision data, and more allowing for the system to perform extra handling on the object. In Unithree components
work the same way. They however, require a `ProcessorPlugin` or implementation within an `Entity` to cause them to
be executed by the core system. A `ProcessorPlugin` is the preferred implementation as this makes the component work
the same across all `Entity` objects versus just a specific class and its inheritors, but sometimes this may be the
best option.

#### Object Lifecycle Management

In `Unity 3D` the only way to instantiate an object into the scene via code was to use the `Object.Instantiate`
method and to destroy was calling an objects `Object.Destroy` method. Similarly, this is how we handle things in
Unithree. Using the Unithree state's `instantiateObject` and the `destroy` method on the Entity objects.
If you do not use this lifecycle for `Entity` based objects the `Entity` may not be processed. All standard `ThreeJS`
objects can be added and removed however you see fit. **WARNING**: If a standard `ThreeJS` object has a child `Entity`
not using the built-in lifecycle management functions you can have undesired behavior.
